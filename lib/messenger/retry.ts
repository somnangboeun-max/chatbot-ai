/**
 * Retry Logic for Messenger Send Operations
 * Story 4.3: Send Automated Responses via Messenger
 *
 * Implements exponential backoff with special handling for rate limits.
 */

import type { SendResult } from "@/types/messenger";

const RATE_LIMIT_ERROR_CODE = 613;
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 seconds
const MAX_RETRY_DELAY_MS = 4000;

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a send operation with retry logic and exponential backoff
 *
 * @param sender - Function that performs the send operation
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Final SendResult after all attempts
 *
 * Retry behavior:
 * - Exponential backoff: 1s, 2s, 4s between retries
 * - Rate limit (code 613): Extended 60s cooldown before retry
 * - Logs each retry attempt
 *
 * @example
 * const result = await sendWithRetry(
 *   () => sendMessage(token, pageId, recipientId, text),
 *   3
 * );
 */
export async function sendWithRetry(
  sender: () => Promise<SendResult>,
  maxRetries: number = 3
): Promise<SendResult> {
  let lastResult: SendResult = {
    success: false,
    error: { code: -1, message: "No attempts made" },
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await sender();

    if (lastResult.success) {
      return lastResult;
    }

    // Rate limit - wait longer
    if (lastResult.error.code === RATE_LIMIT_ERROR_CODE) {
      console.warn("[WARN] [MESSENGER] Rate limited, waiting 60s");
      await delay(RATE_LIMIT_COOLDOWN_MS);
      continue;
    }

    // Last attempt - don't delay
    if (attempt === maxRetries) {
      break;
    }

    // Exponential backoff: 1s, 2s, 4s
    const backoffMs = Math.min(
      1000 * Math.pow(2, attempt - 1),
      MAX_RETRY_DELAY_MS
    );
    console.info("[INFO] [MESSENGER] Retry attempt:", {
      attempt,
      nextIn: backoffMs,
    });
    await delay(backoffMs);
  }

  console.error("[ERROR] [MESSENGER] All retries exhausted");
  return lastResult;
}
