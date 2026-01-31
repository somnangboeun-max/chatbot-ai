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
    "ការដឹកជញ្ជូន",
    "បញ្ចុះតម្លៃ",
    "ថែម",
    // English
    "price",
    "cost",
    "how much",
    "menu",
    "delivery fee",
    "discount",
    "promotion",
    "promo",
    "sale",
  ],
  hours_query: [
    // Khmer (compound phrases first for priority)
    "ម៉ោងបើក",
    "ម៉ោងបិទ",
    "ម៉ោង",
    "បើក",
    "បិទ",
    "ពេលណា",
    // English
    "hours",
    "open",
    "close",
    "when",
    "schedule",
    "available",
  ],
  location_query: [
    // Khmer
    "ទីតាំង",
    "នៅឯណា",
    "អាសយដ្ឋាន",
    "ហាង",
    "ជិត",
    "ផ្លូវ",
    // English
    "location",
    "address",
    "where",
    "directions",
    "find you",
    "shop",
    "store",
    "map",
  ],
  phone_query: [
    // Khmer
    "ទូរស័ព្ទ",
    "លេខ",
    "ទំនាក់ទំនង",
    "ទំនាក់",
    // English
    "phone",
    "call",
    "contact",
    "telegram",
    "line", // Broad — may false-positive; kept for LINE app common in Cambodia
    "message",
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
 * Commerce synonym mapping for secondary intent matching.
 * These catch common English words used in Cambodian commerce
 * that don't appear in the primary keyword lists.
 * Only activated when no primary keyword match is found.
 */
const COMMERCE_SYNONYMS: Record<string, Exclude<Intent, "general_faq">> = {
  delivery: "price_query",
  deliver: "price_query",
  wifi: "location_query",
  parking: "location_query",
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
 * Normalize a message for reliable keyword matching.
 * - Lowercases Latin characters only (Khmer has no case)
 * - Strips zero-width characters common in Khmer text
 * - Normalizes unicode whitespace
 * - Collapses multiple spaces
 */
export function normalizeMessage(message: string): string {
  let result = message;

  // Remove zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
  result = result.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");

  // Replace non-breaking space (U+00A0) with regular space
  result = result.replace(/\u00A0/g, " ");

  // Lowercase Latin characters only (Khmer has no case)
  result = result.replace(/[A-Z]/g, (ch) => ch.toLowerCase());

  // Collapse multiple whitespace to single space and trim
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

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
  const normalizedMessage = normalizeMessage(message);

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

  // Secondary pass: check commerce synonyms
  const words = normalizedMessage.split(/\s+/);
  for (const word of words) {
    // Strip punctuation for synonym lookup
    const cleanWord = word.replace(/[?។!.,;:]/g, "");
    const synonymIntent = COMMERCE_SYNONYMS[cleanWord];
    if (synonymIntent) {
      return {
        intent: synonymIntent,
        confidence: "medium",
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
  message: string,
  priceKeywords: string[]
): string | undefined {
  // normalizeMessage is idempotent — safe even when caller pre-normalized
  let remaining = normalizeMessage(message);

  // Remove all known price keywords
  for (const keyword of priceKeywords) {
    remaining = remaining.replace(new RegExp(escapeRegExp(keyword.toLowerCase()), "g"), "");
  }

  // Remove common English filler words (word boundary safe for Latin script)
  const fillerWords = ["is", "the", "of", "for", "a", "an"];
  for (const filler of fillerWords) {
    remaining = remaining.replace(new RegExp(`\\b${escapeRegExp(filler)}\\b`, "gi"), "");
  }

  // Remove Khmer filler words (no word boundaries — Khmer has none)
  const khmerFillers = ["បង", "អី", "នេះ", "នោះ", "មួយ"];
  for (const filler of khmerFillers) {
    remaining = remaining.split(filler).join("");
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
