/**
 * Facebook Messenger Webhook Payload Parser
 * Story 4.2: Messenger Webhook Receiver
 *
 * Parses incoming webhook payloads from Facebook Messenger
 * and extracts message data for processing.
 */

import type {
  MessengerWebhookPayload,
  ParsedMessage,
} from "@/types/messenger";

/**
 * Type guard to validate webhook payload structure
 * Uses runtime checks instead of unsafe `as` type assertion
 */
function isWebhookPayload(payload: unknown): payload is MessengerWebhookPayload {
  if (payload === null || typeof payload !== "object") {
    return false;
  }
  const obj = payload as Record<string, unknown>;
  return typeof obj.object === "string" && Array.isArray(obj.entry);
}

/**
 * Parse a webhook payload from Facebook Messenger
 *
 * Extracts text messages from the payload, filtering out:
 * - Echo messages (messages sent by the Page itself)
 * - Delivery receipts
 * - Read receipts
 * - Messages without text (attachments only)
 *
 * @param payload - The raw webhook payload (unknown type for safety)
 * @returns Array of parsed messages ready for processing
 *
 * @example
 * const messages = parseWebhookPayload(requestBody);
 * for (const message of messages) {
 *   await processIncomingMessage(message);
 * }
 */
export function parseWebhookPayload(payload: unknown): ParsedMessage[] {
  const messages: ParsedMessage[] = [];

  try {
    // Validate payload structure using type guard (no unsafe `as` assertion)
    if (!isWebhookPayload(payload)) {
      console.warn("[WARN] [WEBHOOK] Invalid payload structure");
      return messages;
    }

    // Validate this is a Page webhook
    if (payload.object !== "page") {
      console.warn("[WARN] [WEBHOOK] Non-page webhook received:", {
        object: payload.object,
      });
      return messages;
    }

    // Process each entry (one per Page)
    for (const entry of payload.entry) {
      // Validate messaging array exists
      if (!Array.isArray(entry.messaging)) {
        continue;
      }

      // Process each messaging event
      for (const messaging of entry.messaging) {
        // Skip if no message (could be delivery, read, or postback)
        if (!messaging.message) {
          continue;
        }

        // Skip echo messages (messages sent by the Page)
        if (messaging.message.is_echo) {
          continue;
        }

        // Skip messages without text (attachments, stickers, etc.)
        if (!messaging.message.text) {
          continue;
        }

        // Validate required fields
        if (!messaging.sender?.id || !messaging.recipient?.id || !messaging.message.mid) {
          console.warn("[WARN] [WEBHOOK] Missing required message fields:", {
            hasSender: !!messaging.sender?.id,
            hasRecipient: !!messaging.recipient?.id,
            hasMid: !!messaging.message.mid,
          });
          continue;
        }

        // Extract and add the parsed message
        messages.push({
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          timestamp: messaging.timestamp,
          messageText: messaging.message.text,
          messageId: messaging.message.mid,
        });
      }
    }
  } catch (error) {
    console.error("[ERROR] [WEBHOOK] Failed to parse payload:", error);
  }

  if (messages.length > 0) {
    console.info("[INFO] [WEBHOOK] Parsed messages:", { count: messages.length });
  }

  return messages;
}
