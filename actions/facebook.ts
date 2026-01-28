"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken, decryptCookieData } from "@/lib/encryption";
import { subscribeWebhook, unsubscribeWebhook } from "@/lib/facebook/client";
import type { ActionResult, FacebookConnectionStatus, PendingFacebookPages } from "@/types";

/**
 * Select and connect a Facebook Page
 *
 * Retrieves pending Pages from cookie, subscribes to webhook,
 * encrypts token and stores in database.
 */
export async function selectFacebookPage(
  pageId: string
): Promise<ActionResult<{ pageName: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  // Get pending pages from cookie
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get("facebook_pending_pages")?.value;

  if (!pendingCookie) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "No pending pages found. Please restart the connection flow." },
    };
  }

  let pendingPages: PendingFacebookPages;
  try {
    // Decrypt the cookie data
    pendingPages = decryptCookieData<PendingFacebookPages>(pendingCookie);
  } catch {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid or tampered pending pages data" },
    };
  }

  // Check expiry
  if (Date.now() > pendingPages.expiresAt) {
    cookieStore.delete("facebook_pending_pages");
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Session expired. Please restart the connection flow." },
    };
  }

  // Find the selected page
  const selectedPage = pendingPages.pages.find((p) => p.id === pageId);
  if (!selectedPage) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Page not found in pending list" },
    };
  }

  try {
    // Subscribe to webhook
    await subscribeWebhook(selectedPage.id, selectedPage.access_token);

    // Encrypt the page access token
    const encryptedToken = encryptToken(selectedPage.access_token);

    // Store in database
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        facebook_page_id: selectedPage.id,
        facebook_page_name: selectedPage.name,
        facebook_page_avatar_url: selectedPage.picture?.data?.url || null,
        facebook_access_token: encryptedToken,
        facebook_connected_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("[ERROR] [FACEBOOK] DB update failed:", {
        tenantId,
        error: updateError.message,
      });
      return {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to save connection" },
      };
    }

    // Clear pending cookie
    cookieStore.delete("facebook_pending_pages");

    console.info("[INFO] [FACEBOOK] Page connected:", {
      tenantId,
      pageId: selectedPage.id,
      pageName: selectedPage.name,
    });

    revalidatePath("/settings/facebook");
    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true, data: { pageName: selectedPage.name } };
  } catch (err) {
    console.error("[ERROR] [FACEBOOK] Connection failed:", err);
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to connect page" },
    };
  }
}

/**
 * Get Facebook connection status
 *
 * Returns current connection state for UI display.
 */
export async function getFacebookStatus(): Promise<ActionResult<FacebookConnectionStatus>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("facebook_page_id, facebook_page_name, facebook_page_avatar_url, facebook_connected_at")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [FACEBOOK] Status fetch failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch status" },
    };
  }

  const status: FacebookConnectionStatus = {
    isConnected: !!business.facebook_page_id,
    pageId: business.facebook_page_id,
    pageName: business.facebook_page_name,
    pageAvatarUrl: business.facebook_page_avatar_url,
    connectedAt: business.facebook_connected_at,
  };

  return { success: true, data: status };
}

/**
 * Disconnect Facebook Page
 *
 * Unsubscribes from webhook and clears connection data.
 */
export async function disconnectFacebookPage(): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  // Get current connection to unsubscribe webhook
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("facebook_page_id, facebook_access_token")
    .eq("id", tenantId)
    .single();

  if (fetchError || !business?.facebook_page_id) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "No Facebook connection found" },
    };
  }

  // Attempt to unsubscribe webhook (don't fail if this fails)
  if (business.facebook_access_token) {
    try {
      const decryptedToken = decryptToken(business.facebook_access_token);
      await unsubscribeWebhook(business.facebook_page_id, decryptedToken);
    } catch (err) {
      console.warn("[WARN] [FACEBOOK] Webhook unsubscribe failed:", err);
    }
  }

  // Clear connection data in database
  const { error: updateError } = await supabase
    .from("businesses")
    .update({
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_avatar_url: null,
      facebook_access_token: null,
      facebook_connected_at: null,
    })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [FACEBOOK] Disconnect failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to disconnect" },
    };
  }

  console.info("[INFO] [FACEBOOK] Page disconnected:", { tenantId });

  revalidatePath("/settings/facebook");
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true, data: null };
}
