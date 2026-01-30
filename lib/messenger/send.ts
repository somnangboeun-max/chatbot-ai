/**
 * Facebook Messenger Send API
 * Story 4.3: Send Automated Responses via Messenger
 *
 * Sends messages to customers via the Messenger Send API.
 * Reference: https://developers.facebook.com/docs/messenger-platform/send-messages
 */

import type { SendMessagePayload, SendResult } from "@/types/messenger";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Send a text message to a Messenger user
 *
 * @param pageAccessToken - The Page access token (passed via Authorization header)
 * @param pageId - The Facebook Page ID
 * @param recipientId - The Facebook sender ID (PSID) of the recipient
 * @param text - The message text to send
 * @returns SendResult with success status and messageId or error
 *
 * @example
 * const result = await sendMessage(token, "page123", "user456", "Hello!");
 * if (result.success) {
 *   console.log("Sent:", result.messageId);
 * }
 */
export async function sendMessage(
  pageAccessToken: string,
  pageId: string,
  recipientId: string,
  text: string
): Promise<SendResult> {
  const payload: SendMessagePayload = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: "RESPONSE",
  };

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${pageId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pageAccessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as {
      recipient_id?: string;
      message_id?: string;
      error?: {
        code?: number;
        message?: string;
      };
    };

    if (!response.ok) {
      console.error("[ERROR] [MESSENGER] Send failed:", {
        code: data.error?.code,
        message: data.error?.message,
      });
      return {
        success: false,
        error: {
          code: data.error?.code ?? 0,
          message: data.error?.message ?? "Unknown error",
        },
      };
    }

    const messageId = data.message_id ?? "";
    console.info("[INFO] [MESSENGER] Sent:", {
      recipientId,
      messageId,
    });
    return { success: true, messageId };
  } catch (error) {
    console.error("[ERROR] [MESSENGER] Send exception:", error);
    return {
      success: false,
      error: {
        code: -1,
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}
