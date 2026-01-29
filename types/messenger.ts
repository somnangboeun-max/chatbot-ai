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
