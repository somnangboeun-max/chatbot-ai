/**
 * Currency Formatting Utilities
 *
 * Format prices for display in both USD and KHR (Cambodian Riel).
 * Supports Khmer numeral display if preferred.
 */

export type Currency = "USD" | "KHR";

// Khmer numeral characters for optional conversion
const KHMER_NUMERALS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

/**
 * Convert Arabic numerals to Khmer numerals
 */
export function toKhmerNumerals(num: string | number): string {
  return String(num)
    .split("")
    .map((char) => {
      const digit = parseInt(char, 10);
      return isNaN(digit) ? char : KHMER_NUMERALS[digit];
    })
    .join("");
}

/**
 * Format price for display
 *
 * USD: $5.00
 * KHR: 20,000៛ or ២០,០០០៛ (with Khmer numerals)
 *
 * @param price - The numeric price value
 * @param currency - The currency code (USD or KHR)
 * @param useKhmerNumerals - Whether to use Khmer numerals (default: false)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: Currency,
  useKhmerNumerals = false
): string {
  // Handle edge cases
  if (!isFinite(price) || price < 0) {
    return currency === "USD" ? "$0.00" : "0៛";
  }

  if (currency === "USD") {
    const formatted = price.toFixed(2);
    return useKhmerNumerals ? `$${toKhmerNumerals(formatted)}` : `$${formatted}`;
  }

  // KHR: Format with thousands separators, no decimals (Riel typically whole numbers)
  const formatted = Math.round(price).toLocaleString("en-US");
  return useKhmerNumerals
    ? `${toKhmerNumerals(formatted)}៛`
    : `${formatted}៛`;
}

/**
 * Parse price from formatted string
 *
 * Handles both USD and KHR formats, including Khmer numerals.
 *
 * @param formattedPrice - The formatted price string
 * @returns The numeric price value
 */
export function parsePrice(formattedPrice: string): number {
  // Remove currency symbols and whitespace
  let cleaned = formattedPrice.replace(/[$៛,\s]/g, "");

  // Convert Khmer numerals to Arabic
  KHMER_NUMERALS.forEach((khmer, arabic) => {
    cleaned = cleaned.replace(new RegExp(khmer, "g"), String(arabic));
  });

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return currency === "USD" ? "$" : "៛";
}
