/**
 * SMS Client Placeholder
 *
 * This is a placeholder for SMS sending functionality.
 * For MVP, SMS requests are logged but not actually sent.
 * Future implementation will integrate with an SMS provider.
 */

interface SmsMessage {
  to: string;
  body: string;
}

/**
 * Send an SMS message (placeholder implementation)
 *
 * Currently logs the SMS request for development/testing.
 * Production implementation will integrate with a provider like:
 * - Twilio
 * - Nexmo/Vonage
 * - Local Cambodian SMS providers
 *
 * @param message - The SMS message to send
 * @returns Promise that resolves when the message is "sent"
 */
export async function sendSms(message: SmsMessage): Promise<void> {
  // TODO: Integrate actual SMS provider in future
  // For MVP, just log the request
  console.info("[INFO] [SMS] Would send message:", {
    to: message.to,
    bodyLength: message.body.length,
  });

  // Simulate async operation
  await Promise.resolve();
}

/**
 * Validate SMS configuration is available
 *
 * @returns Whether SMS sending is configured
 */
export function isSmsConfigured(): boolean {
  // SMS is not configured in MVP - always return false
  // Will check for SMS_PROVIDER_API_KEY or similar when implemented
  return false;
}
