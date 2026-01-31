/**
 * Rules-Based Intent Classification
 * Story 4.5: Rules-Based FAQ Matching Engine
 *
 * Keyword-based intent classification for customer messages.
 * Supports Khmer, English, and mixed-language queries.
 * This is deliberately NOT NLP/ML — "rules before AI" philosophy.
 */

import type { Intent, MatchResult } from "./types";

/**
 * Keyword definitions for each intent category.
 * Khmer-first: Khmer keywords listed before English.
 */
const INTENT_KEYWORDS: Record<Exclude<Intent, "general_faq">, string[]> = {
  price_query: [
    // Khmer
    "តម្លៃ",
    "ប៉ុន្មាន",
    "ថ្លៃ",
    // English
    "price",
    "cost",
    "how much",
    "menu",
  ],
  hours_query: [
    // Khmer
    "ម៉ោង",
    "បើក",
    "បិទ",
    "ពេលណា",
    // English
    "hours",
    "open",
    "close",
    "when",
  ],
  location_query: [
    // Khmer
    "ទីតាំង",
    "នៅឯណា",
    "អាសយដ្ឋាន",
    // English
    "location",
    "address",
    "where",
    "directions",
    "find you",
  ],
  phone_query: [
    // Khmer
    "ទូរស័ព្ទ",
    "លេខ",
    "ទំនាក់ទំនង",
    // English
    "phone",
    "call",
    "contact",
  ],
  greeting: [
    // Khmer
    "សួស្តី",
    "ជំរាបសួរ",
    "អរុណសួស្តី",
    // English (avoid short substrings that match inside other words)
    "hello",
    "good morning",
    "good afternoon",
    "good evening",
  ],
  farewell: [
    // Khmer
    "លាហើយ",
    "ជំរាបលា",
    "អរគុណ",
    // English
    "bye",
    "goodbye",
    "thank you",
    "thanks",
  ],
};

/**
 * Priority order for intent matching.
 * Price queries are checked first since they're the most common
 * and may also contain location/hours keywords in context.
 */
const INTENT_PRIORITY: Exclude<Intent, "general_faq">[] = [
  "price_query",
  "hours_query",
  "location_query",
  "phone_query",
  "greeting",
  "farewell",
];

/**
 * Classify a customer message into an intent with confidence.
 *
 * Matching rules:
 * 1. Check each intent's keywords (case-insensitive)
 * 2. If price_query matches, extract product name from message
 * 3. Hours/location/phone matches are deterministic (high confidence)
 * 4. No match → general_faq with low confidence
 */
export function classifyIntent(message: string): MatchResult {
  const normalizedMessage = message.toLowerCase().trim();

  for (const intent of INTENT_PRIORITY) {
    const keywords = INTENT_KEYWORDS[intent];
    const matched = keywords.some((keyword) =>
      normalizedMessage.includes(keyword.toLowerCase())
    );

    if (matched) {
      if (intent === "price_query") {
        const extractedEntity = extractProductName(normalizedMessage, keywords);
        return {
          intent: "price_query",
          confidence: extractedEntity ? "high" : "medium",
          extractedEntity,
        };
      }

      // Hours, location, phone are deterministic lookups
      return {
        intent,
        confidence: "high",
      };
    }
  }

  // No intent matched
  return {
    intent: "general_faq",
    confidence: "low",
  };
}

/**
 * Extract a potential product name from a price query message.
 * Removes known keywords to isolate the product name portion.
 *
 * Example: "តម្លៃ lok lak ប៉ុន្មាន" → "lok lak"
 * Example: "how much is coffee" → "coffee"
 */
export function extractProductName(
  normalizedMessage: string,
  priceKeywords: string[]
): string | undefined {
  let remaining = normalizedMessage;

  // Remove all known price keywords
  for (const keyword of priceKeywords) {
    remaining = remaining.replace(new RegExp(escapeRegExp(keyword.toLowerCase()), "g"), "");
  }

  // Remove common English filler words (word boundary safe for Latin script)
  const fillerWords = ["is", "the", "of", "for", "a", "an"];
  for (const filler of fillerWords) {
    remaining = remaining.replace(new RegExp(`\\b${escapeRegExp(filler)}\\b`, "gi"), "");
  }

  // Remove punctuation directly (no word boundary needed for non-word chars)
  remaining = remaining.replace(/[?។]/g, "");

  // Clean up whitespace
  const cleaned = remaining.replace(/\s+/g, " ").trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
