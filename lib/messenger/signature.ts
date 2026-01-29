/**
 * Facebook Messenger Webhook Signature Verification
 * Story 4.2: Messenger Webhook Receiver
 *
 * Verifies X-Hub-Signature-256 header to ensure webhook payloads
 * are genuinely from Facebook.
 *
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks#signature-verification
 */

import { createHmac } from "crypto";
import { env } from "@/lib/env";

/**
 * Verify the signature of a webhook payload from Facebook
 *
 * @param rawBody - The raw request body as a string
 * @param signatureHeader - The X-Hub-Signature-256 header value
 * @returns true if signature is valid, false otherwise
 *
 * @example
 * const isValid = verifySignature(rawBody, request.headers.get('X-Hub-Signature-256'));
 * if (!isValid) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  // Validate inputs
  if (!signatureHeader) {
    console.warn("[WARN] [WEBHOOK] Missing signature header");
    return false;
  }

  if (!signatureHeader.startsWith("sha256=")) {
    console.warn("[WARN] [WEBHOOK] Malformed signature header - missing sha256= prefix");
    return false;
  }

  // Get app secret
  const appSecret = env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    console.error("[ERROR] [WEBHOOK] FACEBOOK_APP_SECRET not configured");
    return false;
  }

  // Extract signature from header
  const signature = signatureHeader.substring(7); // Remove 'sha256=' prefix

  // Calculate expected signature
  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const isValid = signature.length === expectedSignature.length &&
    timingSafeEqual(signature, expectedSignature);

  if (!isValid) {
    console.warn("[WARN] [WEBHOOK] Invalid signature");
  }

  return isValid;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
