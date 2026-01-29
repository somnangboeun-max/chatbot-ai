/**
 * Facebook Messenger Message Processing Service
 * Story 4.2: Messenger Webhook Receiver
 *
 * Processes incoming messages from Facebook Messenger:
 * - Looks up business by Facebook Page ID
 * - Creates or finds existing conversation
 * - Stores message in database
 * - Updates conversation status based on bot_active flag
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedMessage } from "@/types/messenger";

/**
 * Process an incoming message from Facebook Messenger
 *
 * This function:
 * 1. Finds the business by Facebook Page ID
 * 2. Creates or finds an existing conversation
 * 3. Stores the message in the database
 * 4. Updates conversation status based on bot_active flag
 *
 * @param message - Parsed message from webhook payload
 * @throws Error if database operations fail (caught by caller)
 *
 * @example
 * const messages = parseWebhookPayload(body);
 * for (const message of messages) {
 *   await processIncomingMessage(message);
 * }
 */
export async function processIncomingMessage(
  message: ParsedMessage
): Promise<void> {
  const supabase = createAdminClient();

  // 1. Find business by Facebook Page ID (recipient is the Page)
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, bot_active, facebook_page_id")
    .eq("facebook_page_id", message.recipientId)
    .single();

  if (bizError || !business) {
    // Not an error - could be a message to an unconnected page
    console.warn("[WARN] [WEBHOOK] No business found for page:", {
      pageId: message.recipientId,
    });
    return;
  }

  const tenantId = business.id;

  // 2. Find or create conversation
  let conversationId: string;

  // Try to find existing conversation
  const { data: existingConvo } = await supabase
    .from("conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("facebook_sender_id", message.senderId)
    .single();

  if (existingConvo) {
    conversationId = existingConvo.id;
  } else {
    // Also check by customer_id for backwards compatibility
    const { data: legacyConvo } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("customer_id", message.senderId)
      .single();

    if (legacyConvo) {
      conversationId = legacyConvo.id;

      // Update with facebook_sender_id for future lookups
      await supabase
        .from("conversations")
        .update({ facebook_sender_id: message.senderId })
        .eq("id", conversationId);
    } else {
      // Create new conversation
      const conversationStatus = business.bot_active ? "active" : "needs_attention";

      const { data: newConvo, error: createError } = await supabase
        .from("conversations")
        .insert({
          tenant_id: tenantId,
          customer_id: message.senderId,
          facebook_sender_id: message.senderId,
          status: conversationStatus,
          last_message_at: new Date(message.timestamp).toISOString(),
        })
        .select("id")
        .single();

      if (createError || !newConvo) {
        console.error("[ERROR] [WEBHOOK] Failed to create conversation:", {
          error: createError?.message,
          tenantId,
          senderId: message.senderId,
        });
        throw createError || new Error("Failed to create conversation");
      }

      conversationId = newConvo.id;
      console.info("[INFO] [WEBHOOK] Created conversation:", {
        conversationId,
        tenantId,
      });
    }
  }

  // 3. Check for duplicate message (Facebook can retry webhooks)
  if (message.messageId) {
    const { data: existingMessage } = await supabase
      .from("messages")
      .select("id")
      .eq("facebook_message_id", message.messageId)
      .single();

    if (existingMessage) {
      console.info("[INFO] [WEBHOOK] Duplicate message skipped:", {
        messageId: message.messageId,
      });
      return;
    }
  }

  // 4. Store message
  const { error: msgError } = await supabase.from("messages").insert({
    tenant_id: tenantId,
    conversation_id: conversationId,
    sender_type: "customer",
    content: message.messageText,
    facebook_message_id: message.messageId,
  });

  if (msgError) {
    console.error("[ERROR] [WEBHOOK] Failed to store message:", {
      error: msgError.message,
      conversationId,
    });
    throw msgError;
  }

  // 5. Update conversation last_message_at and status
  const updateData: Record<string, unknown> = {
    last_message_at: new Date(message.timestamp).toISOString(),
  };

  // If bot is paused, mark conversation as needs_attention
  if (!business.bot_active) {
    updateData.status = "needs_attention";
  }

  await supabase.from("conversations").update(updateData).eq("id", conversationId);

  console.info("[INFO] [WEBHOOK] Message stored:", {
    conversationId,
    messageId: message.messageId,
    botActive: business.bot_active,
  });

  // 6. If bot is active, queue response (Story 4.3 will implement this)
  if (business.bot_active) {
    // TODO: Story 4.3 - Queue bot response
    // For now, just log that we would send a response
    console.info("[INFO] [WEBHOOK] Bot response would be queued:", {
      conversationId,
    });
  }
}
