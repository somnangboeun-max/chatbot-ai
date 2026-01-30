/**
 * Messenger Webhook Types
 * Story 4.2: Messenger Webhook Receiver
 *
 * Types for handling Facebook Messenger webhook payloads
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks
 */

/**
 * Root webhook payload from Facebook
 */
export interface MessengerWebhookPayload {
  object: string;
  entry: MessengerEntry[];
}

/**
 * Entry in webhook payload - represents events for a single Page
 */
export interface MessengerEntry {
  id: string;
  time: number;
  messaging: MessengerMessaging[];
}

/**
 * Individual messaging event
 */
export interface MessengerMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: MessengerMessage;
  delivery?: unknown;
  read?: unknown;
  postback?: unknown;
}

/**
 * Message content within a messaging event
 */
export interface MessengerMessage {
  mid: string;
  text?: string;
  is_echo?: boolean;
  attachments?: MessengerAttachment[];
}

/**
 * Attachment in a message (images, files, etc.)
 */
export interface MessengerAttachment {
  type: string;
  payload?: {
    url?: string;
  };
}

/**
 * Parsed message extracted from webhook payload
 * Simplified structure for processing
 */
export interface ParsedMessage {
  senderId: string;
  recipientId: string;
  timestamp: number;
  messageText: string;
  messageId: string;
}

/**
 * Conversation status values
 * Note: Must match database CHECK constraint values exactly
 * Webhook processing only uses 'active' and 'needs_attention',
 * but type includes all valid database values for type safety.
 */
export type ConversationStatus =
  | "active"
  | "bot_handled"
  | "needs_attention"
  | "owner_handled";

/**
 * Message sender type for database
 */
export type SenderType = "customer" | "bot" | "owner";

/**
 * Handover reason for escalation to human
 * Note: Must match database CHECK constraint values exactly
 */
export type HandoverReason =
  | "low_confidence"
  | "customer_frustrated"
  | "human_requested"
  | "complex_question";

/**
 * Send API Types
 * Story 4.3: Send Automated Responses via Messenger
 *
 * Types for sending messages via Facebook Messenger Send API
 * Reference: https://developers.facebook.com/docs/messenger-platform/send-messages
 */

/**
 * Payload for sending a message via Send API
 */
export interface SendMessagePayload {
  recipient: {
    id: string;
  };
  message: {
    text: string;
  };
  messaging_type: "RESPONSE" | "UPDATE" | "MESSAGE_TAG";
}

/**
 * Success response from Send API
 */
export interface SendMessageResponse {
  recipient_id: string;
  message_id: string;
}

/**
 * Error response from Send API
 */
export interface SendError {
  code: number;
  message: string;
  type?: string;
  error_subcode?: number;
  fbtrace_id?: string;
}

/**
 * Result of a send operation (discriminated union)
 * Follows the project's ActionResult<T> pattern for type-safe branching.
 */
export type SendResult =
  | { success: true; messageId: string }
  | {
      success: false;
      error: {
        code: number;
        message: string;
      };
    };
