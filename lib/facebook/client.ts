/**
 * Facebook Graph API client
 * Story 4.1: Facebook Page Connection Flow
 *
 * Follows the pattern from lib/telegram/client.ts
 */

import { env } from "@/lib/env";
import type { FacebookPage } from "@/types";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface GraphApiError {
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Exchange OAuth authorization code for user access token
 *
 * @param code - Authorization code from OAuth callback
 * @param redirectUri - The redirect URI used in the OAuth flow
 * @returns User access token
 * @throws Error if token exchange fails or env vars not configured
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error("[ERROR] [FACEBOOK] App credentials not configured");
    throw new Error("Facebook app credentials are not configured");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params}`
  );
  const data = (await response.json()) as { access_token?: string } & GraphApiError;

  if (!response.ok || data.error) {
    console.error("[ERROR] [FACEBOOK] Token exchange failed:", {
      status: response.status,
      error: data.error?.message,
    });
    throw new Error(data.error?.message || "Token exchange failed");
  }

  if (!data.access_token) {
    console.error("[ERROR] [FACEBOOK] No access token in response");
    throw new Error("No access token received");
  }

  console.info("[INFO] [FACEBOOK] Token exchanged successfully");
  return data.access_token;
}

/**
 * Fetch the list of Facebook Pages the user manages
 *
 * @param userToken - User access token from OAuth
 * @returns Array of Facebook Pages with id, name, access_token, picture
 * @throws Error if API call fails
 */
export async function fetchUserPages(
  userToken: string
): Promise<FacebookPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,picture{url}&access_token=${userToken}`
  );
  const data = (await response.json()) as { data?: FacebookPage[] } & GraphApiError;

  if (!response.ok || data.error) {
    console.error("[ERROR] [FACEBOOK] Fetch pages failed:", {
      status: response.status,
      error: data.error?.message,
    });
    throw new Error(data.error?.message || "Failed to fetch pages");
  }

  const pages = data.data || [];
  console.info("[INFO] [FACEBOOK] Pages fetched:", { count: pages.length });
  return pages;
}

/**
 * Subscribe a Facebook Page to receive webhook events
 *
 * @param pageId - The Facebook Page ID
 * @param pageToken - The Page access token
 * @throws Error if subscription fails
 */
export async function subscribeWebhook(
  pageId: string,
  pageToken: string
): Promise<void> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${pageToken}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const data = (await response.json()) as GraphApiError;
    console.error("[ERROR] [FACEBOOK] Webhook subscription failed:", {
      pageId,
      status: response.status,
      error: data.error?.message,
    });
    throw new Error(data.error?.message || "Failed to subscribe to webhook");
  }

  console.info("[INFO] [FACEBOOK] Webhook subscribed:", { pageId });
}

/**
 * Unsubscribe a Facebook Page from webhook events
 *
 * @param pageId - The Facebook Page ID
 * @param pageToken - The Page access token
 */
export async function unsubscribeWebhook(
  pageId: string,
  pageToken: string
): Promise<void> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${pageToken}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const data = (await response.json()) as GraphApiError;
      console.warn("[WARN] [FACEBOOK] Webhook unsubscribe failed:", {
        pageId,
        status: response.status,
        error: data.error?.message,
      });
    } else {
      console.info("[INFO] [FACEBOOK] Webhook unsubscribed:", { pageId });
    }
  } catch (err) {
    console.warn("[WARN] [FACEBOOK] Webhook unsubscribe error:", err);
  }
}
