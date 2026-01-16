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
