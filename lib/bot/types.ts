/**
 * Bot Engine Types
 * Story 4.5: Rules-Based FAQ Matching Engine
 *
 * Types for the rules-based bot response engine.
 * All critical business information (prices, hours, location) comes
 * from database lookups, never LLM guessing.
 */

/**
 * Supported intent categories for rules-based matching.
 * Each intent maps to a specific database lookup.
 */
export type Intent =
  | "price_query"
  | "hours_query"
  | "location_query"
  | "phone_query"
  | "greeting"
  | "farewell"
  | "general_faq";

/**
 * Confidence levels for bot response accuracy.
 * - high: Exact intent match + data found (e.g., asked about "lok lak" and it exists)
 * - medium: Intent matched but uncertain data (e.g., partial product name, full list)
 * - low: No intent matched or data not found → escalate to human
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Threshold: respond if confidence >= medium; escalate if low.
 */
export const CONFIDENCE_THRESHOLD: ConfidenceLevel = "medium";

/**
 * Result from intent classification (rules.ts)
 */
export interface MatchResult {
  intent: Intent;
  confidence: ConfidenceLevel;
  /** Extracted entity from message (e.g., product name for price_query) */
  extractedEntity?: string;
}

/**
 * Final bot response returned by the engine
 */
export interface BotResponse {
  responseText: string;
  confidence: ConfidenceLevel;
  intent: Intent;
  /** Product name that was matched (for price queries) */
  matchedProduct?: string;
}

/**
 * Product record from database
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  is_active: boolean;
}

/**
 * Business info record from database
 */
export interface BusinessInfo {
  opening_hours: Record<string, { open: string; close: string }> | null;
  address: string | null;
  phone: string | null;
}
