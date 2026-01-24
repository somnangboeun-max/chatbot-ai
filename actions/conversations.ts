"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

const conversationIdSchema = z.string().uuid("Invalid conversation ID");

export async function markConversationViewed(
  conversationId: string,
): Promise<ActionResult<{ viewedAt: string }>> {
  const parsed = conversationIdSchema.safeParse(conversationId);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid conversation ID format" },
    };
  }

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

  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("conversations")
      .update({ viewed_at: now })
      .eq("id", conversationId)
      .eq("tenant_id", tenantId);

    if (error) throw error;

    console.info("[INFO] [CONVERSATIONS] Marked viewed:", { conversationId, tenantId });
    return { success: true, data: { viewedAt: now } };
  } catch (error) {
    console.error("[ERROR] [CONVERSATIONS] Mark viewed failed:", { conversationId, tenantId, error });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to mark conversation as viewed" },
    };
  }
}
