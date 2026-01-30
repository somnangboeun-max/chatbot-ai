/**
 * Response Processing Service
 * Story 4.3: Send Automated Responses via Messenger
 *
 * Orchestrates the full response flow:
 * 1. Lookup business and decrypt token
 * 2. Lookup conversation for recipient ID
 * 3. Generate response (MVP: default template)
 * 4. Send via Messenger with retry
 * 5. Store bot message or escalate on failure
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/encryption";
import { sendMessage } from "./send";
import { sendWithRetry } from "./retry";
import { getDefaultResponse } from "@/lib/bot/templates";

/**
 * Process an incoming message and send an automated response
 *
 * @param tenantId - The business/tenant ID
 * @param conversationId - The conversation to respond to
 * @param customerMessage - The customer's message (for future FAQ matching)
 *
 * This function:
 * 1. Gets business with encrypted Facebook token
 * 2. Decrypts the Page access token
 * 3. Gets conversation for recipient's Facebook sender ID
 * 4. Generates response (MVP: default acknowledgment)
 * 5. Sends via Messenger with retry logic
 * 6. Stores bot message on success
 * 7. Escalates conversation on failure
 *
 * Note: This function does not throw - errors are logged and handled internally
 */
export async function processAndRespond(
  tenantId: string,
  conversationId: string,
  _customerMessage: string // Prefixed with _ as unused in MVP; Story 4.5 will use for FAQ matching
): Promise<void> {
  const supabase = createAdminClient();

  try {
    // 1. Get business with encrypted token
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("facebook_access_token, facebook_page_id")
      .eq("id", tenantId)
      .single();

    if (bizError || !business?.facebook_access_token || !business.facebook_page_id) {
      console.error("[ERROR] [RESPOND] No access token or page ID for tenant:", {
        tenantId,
        error: bizError?.message,
      });
      return;
    }

    // 2. Decrypt token
    let pageAccessToken: string;
    try {
      pageAccessToken = decryptToken(business.facebook_access_token);
    } catch (decryptError) {
      console.error("[ERROR] [RESPOND] Token decryption failed:", {
        tenantId,
        error:
          decryptError instanceof Error
            ? decryptError.message
            : "Unknown error",
      });
      // Escalate - invalid token means we can't respond
      await supabase
        .from("conversations")
        .update({ status: "needs_attention" })
        .eq("id", conversationId);
      return;
    }

    // 3. Get conversation for recipient ID
    const { data: conversation, error: convoError } = await supabase
      .from("conversations")
      .select("facebook_sender_id")
      .eq("id", conversationId)
      .single();

    if (convoError || !conversation?.facebook_sender_id) {
      console.error("[ERROR] [RESPOND] Conversation not found:", {
        conversationId,
        error: convoError?.message,
      });
      return;
    }

    // Type guard ensures facebook_sender_id is string (not null)
    const recipientId = conversation.facebook_sender_id;
    const pageId = business.facebook_page_id;

    // 4. Generate response (MVP: default template; Story 4.5+ adds FAQ matching)
    const responseText = getDefaultResponse();

    // 5. Send with retry
    const result = await sendWithRetry(() =>
      sendMessage(pageAccessToken, pageId, recipientId, responseText)
    );

    // 6. Store bot message if successful
    if (result.success) {
      const { error: insertError } = await supabase.from("messages").insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        sender_type: "bot",
        content: responseText,
        facebook_message_id: result.messageId,
      });

      if (insertError) {
        console.error("[ERROR] [RESPOND] Failed to store bot message:", {
          conversationId,
          error: insertError.message,
        });
      } else {
        console.info("[INFO] [RESPOND] Bot message stored:", { conversationId });
      }
    } else {
      // 7. Escalate on failure
      console.error("[ERROR] [RESPOND] Send failed, escalating:", {
        conversationId,
        error: result.error,
      });
      await supabase
        .from("conversations")
        .update({ status: "needs_attention" })
        .eq("id", conversationId);
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("[ERROR] [RESPOND] Unexpected error:", {
      tenantId,
      conversationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Try to escalate conversation
    try {
      await supabase
        .from("conversations")
        .update({ status: "needs_attention" })
        .eq("id", conversationId);
    } catch {
      // Ignore escalation failure - nothing more we can do
    }
  }
}
