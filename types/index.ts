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
export type { ConversationStatus, ConversationListItem } from "./conversations";

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
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from "./database.types";
