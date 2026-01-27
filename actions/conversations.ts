"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, HandoverReason } from "@/types";
import type { ConversationListItem, ConversationStatus, ConversationDetail } from "@/types/conversations";

const conversationIdSchema = z.string().uuid("Invalid conversation ID");

const conversationStatusSchema = z.enum(["active", "bot_handled", "needs_attention", "owner_handled"]);

const handoverReasonSchema = z.enum([
  "low_confidence",
  "customer_frustrated",
  "human_requested",
  "complex_question",
]);

function parseConversationStatus(status: unknown): ConversationStatus {
  const result = conversationStatusSchema.safeParse(status);
  return result.success ? result.data : "active";
}

function parseHandoverReason(reason: unknown): HandoverReason | null {
  if (reason === null || reason === undefined) return null;
  const result = handoverReasonSchema.safeParse(reason);
  return result.success ? result.data : null;
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

export async function getConversationDetail(
  conversationId: string
): Promise<ActionResult<ConversationDetail>> {
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
    const { data, error } = await supabase
      .from("conversations")
      .select("id, customer_name, customer_avatar_url, status, handover_reason, viewed_at")
      .eq("id", conversationId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Conversation not found" },
        };
      }
      throw error;
    }

    const detail: ConversationDetail = {
      id: data.id,
      customerName: data.customer_name ?? "Unknown Customer",
      customerAvatarUrl: data.customer_avatar_url,
      status: parseConversationStatus(data.status),
      handoverReason: parseHandoverReason(data.handover_reason),
      viewedAt: data.viewed_at,
    };

    console.info("[INFO] [CONVERSATIONS] Detail fetched:", { tenantId, conversationId });
    return { success: true, data: detail };
  } catch (error) {
    console.error("[ERROR] [CONVERSATIONS] Detail fetch failed:", { tenantId, conversationId, error });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load conversation details" },
    };
  }
}
