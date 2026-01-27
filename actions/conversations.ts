"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import type { ConversationListItem, ConversationStatus } from "@/types/conversations";

const conversationIdSchema = z.string().uuid("Invalid conversation ID");

const conversationStatusSchema = z.enum(["active", "bot_handled", "needs_attention", "owner_handled"]);

function parseConversationStatus(status: unknown): ConversationStatus {
  const result = conversationStatusSchema.safeParse(status);
  return result.success ? result.data : "active";
}

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

export async function getConversations(
  cursor?: string,
  limit: number = 20
): Promise<ActionResult<{ conversations: ConversationListItem[]; nextCursor: string | null }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return { success: false, error: { code: "FORBIDDEN", message: "No business associated" } };
  }

  try {
    let query = supabase
      .from("conversations")
      .select("id, customer_name, customer_avatar_url, status, last_message_preview, last_message_at, viewed_at")
      .eq("tenant_id", tenantId)
      .order("last_message_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("last_message_at", cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = (data ?? []).length > limit;
    const conversations = (data ?? []).slice(0, limit).map((row) => ({
      id: row.id,
      customerName: row.customer_name ?? "Unknown Customer",
      customerAvatarUrl: row.customer_avatar_url,
      status: parseConversationStatus(row.status),
      lastMessagePreview: row.last_message_preview,
      lastMessageAt: row.last_message_at,
      viewedAt: row.viewed_at,
    }));

    const lastConversation = conversations[conversations.length - 1];
    const nextCursor = hasMore && lastConversation ? lastConversation.lastMessageAt : null;

    console.info("[INFO] [CONVERSATIONS] Fetched:", { tenantId, count: conversations.length, hasMore });
    return { success: true, data: { conversations, nextCursor } };
  } catch (error) {
    console.error("[ERROR] [CONVERSATIONS] Fetch failed:", { tenantId, error });
    return { success: false, error: { code: "SERVER_ERROR", message: "Failed to load conversations" } };
  }
}
