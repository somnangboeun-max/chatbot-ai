"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import type { Message, MessageSenderType } from "@/types/messages";

const conversationIdSchema = z.string().uuid("Invalid conversation ID");

const messageSenderTypeSchema = z.enum(["customer", "bot", "owner"]);

function parseMessageSenderType(value: unknown): MessageSenderType {
  const result = messageSenderTypeSchema.safeParse(value);
  return result.success ? result.data : "customer";
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit: number = 30
): Promise<ActionResult<{ messages: Message[]; nextCursor: string | null }>> {
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
    // First verify conversation belongs to this tenant
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("tenant_id", tenantId)
      .single();

    if (convError || !conversation) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Conversation not found" },
      };
    }

    let query = supabase
      .from("messages")
      .select("id, conversation_id, sender_type, content, created_at, is_handover_trigger")
      .eq("conversation_id", conversationId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = (data ?? []).length > limit;
    const messages: Message[] = (data ?? []).slice(0, limit).map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderType: parseMessageSenderType(row.sender_type),
      content: row.content,
      createdAt: row.created_at,
      isHandoverTrigger: row.is_handover_trigger ?? false,
    }));

    const lastMessage = messages[messages.length - 1];
    const nextCursor = hasMore && lastMessage ? lastMessage.createdAt : null;

    console.info("[INFO] [MESSAGES] Fetched:", {
      tenantId,
      conversationId,
      count: messages.length,
      hasMore,
    });

    return { success: true, data: { messages, nextCursor } };
  } catch (error) {
    console.error("[ERROR] [MESSAGES] Fetch failed:", { tenantId, conversationId, error });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load messages" },
    };
  }
}
