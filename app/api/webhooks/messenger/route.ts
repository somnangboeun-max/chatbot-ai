/**
 * Facebook Messenger Webhook Route Handler
 * Story 4.2: Messenger Webhook Receiver
 *
 * Handles webhook verification (GET) and message reception (POST)
 * from Facebook Messenger Platform.
 *
 * Reference: https://developers.facebook.com/docs/messenger-platform/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifySignature } from "@/lib/messenger/signature";
import { parseWebhookPayload } from "@/lib/messenger/webhook";
import { processIncomingMessage } from "@/lib/messenger/process";

/**
 * GET: Webhook verification endpoint
 *
 * Called by Facebook during webhook setup to verify the endpoint.
 * Returns the challenge string if verification succeeds.
 *
 * Query Parameters:
 * - hub.mode: Should be "subscribe"
 * - hub.verify_token: Must match FACEBOOK_VERIFY_TOKEN
 * - hub.challenge: Challenge to return if verification succeeds
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.info("[INFO] [WEBHOOK] Verification request received:", { mode });

  // Validate server configuration
  if (!env.FACEBOOK_VERIFY_TOKEN) {
    console.error("[ERROR] [WEBHOOK] FACEBOOK_VERIFY_TOKEN not configured");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  // Validate required parameters
  if (!mode || !token || !challenge) {
    console.warn("[WARN] [WEBHOOK] Missing verification parameters");
    return new NextResponse("Missing parameters", { status: 400 });
  }

  // Verify mode and token
  if (mode === "subscribe" && token === env.FACEBOOK_VERIFY_TOKEN) {
    console.info("[INFO] [WEBHOOK] Verification successful");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WARN] [WEBHOOK] Verification failed - token mismatch");
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST: Message reception endpoint
 *
 * Receives webhook events from Facebook Messenger.
 * CRITICAL: Must return 200 within 5 seconds or Facebook will retry.
 *
 * Security: Verifies X-Hub-Signature-256 header before processing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Read raw body for signature verification
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-Hub-Signature-256");

  // CRITICAL: Verify signature before any processing
  if (!verifySignature(rawBody, signatureHeader)) {
    console.error("[ERROR] [WEBHOOK] Signature verification failed");
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Parse body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error("[ERROR] [WEBHOOK] Invalid JSON in request body");
    return new NextResponse("Bad Request", { status: 400 });
  }

  // CRITICAL: Respond to Facebook immediately to meet 5-second requirement
  // Process messages asynchronously after response
  processMessagesAsync(body).catch((err) => {
    console.error("[ERROR] [WEBHOOK] Async processing failed:", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  });

  // Return success immediately
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}

/**
 * Process webhook messages asynchronously
 *
 * This function runs after the response is sent to Facebook.
 * Errors are caught and logged but don't affect the webhook response.
 */
async function processMessagesAsync(body: unknown): Promise<void> {
  const messages = parseWebhookPayload(body);

  if (messages.length === 0) {
    return;
  }

  console.info("[INFO] [WEBHOOK] Processing messages asynchronously:", {
    count: messages.length,
  });

  // Process each message sequentially to maintain order
  for (const message of messages) {
    try {
      await processIncomingMessage(message);
    } catch (error) {
      // Log but continue processing remaining messages
      console.error("[ERROR] [WEBHOOK] Message processing failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        messageId: message.messageId,
        senderId: message.senderId,
      });
    }
  }
}
