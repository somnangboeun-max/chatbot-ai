/**
 * TypeScript type definitions
 * Re-export all types from this file for cleaner imports
 */

// ActionResult type for Server Actions (CRITICAL: Never throw, always return this)
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: ErrorCode;
        message: string;
        details?: Record<string, string[]>;
      };
    };

// Re-export dashboard types
export type { HandoverReason, AttentionItem, DashboardStats, DashboardStatsResult } from "./dashboard";

// Re-export conversation types
export type { ConversationStatus, ConversationListItem, ConversationDetail } from "./conversations";

// Re-export message types
export type { MessageSenderType, Message } from "./messages";

// Re-export Facebook types
export type { FacebookPage, FacebookConnectionStatus, PendingFacebookPages } from "./facebook";

// Re-export Messenger webhook types
export type {
  MessengerWebhookPayload,
  MessengerEntry,
  MessengerMessaging,
  MessengerMessage,
  ParsedMessage,
  ConversationStatus as WebhookConversationStatus, // Alias for backwards compatibility
  SenderType,
  HandoverReason as WebhookHandoverReason,
  // Send API types (Story 4.3)
  SendMessagePayload,
  SendMessageResponse,
  SendError,
  SendResult,
} from "./messenger";

// Re-export database types
// Note: database.types.ts should be regenerated with `npm run db:types`
// after applying migrations to Supabase
export type {
  Database,
  Business,
  BusinessInsert,
  BusinessUpdate,
  Product,
  ProductInsert,
  ProductUpdate,
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  Message as DbMessage,
  MessageInsert,
  MessageUpdate,
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from "./database.types";
