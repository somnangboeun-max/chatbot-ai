import { sendTelegramMessage } from "./client";

interface HandoverNotification {
  businessName: string;
  customerName: string;
  messagePreview: string;
  reason:
    | "low_confidence"
    | "customer_frustrated"
    | "human_requested"
    | "complex_question";
  conversationUrl?: string;
}

const REASON_LABELS: Record<string, string> = {
  low_confidence: "Bot was not confident",
  customer_frustrated: "Customer seems frustrated",
  human_requested: "Customer asked for human",
  complex_question: "Complex question detected",
};

/**
 * Send handover notification to staff via Telegram
 *
 * This function will be called from Epic 5 handover flow.
 * It formats a notification message with all relevant context
 * for the staff member to review and take over the conversation.
 *
 * @param chatId - Telegram chat ID or username to send notification to
 * @param notification - Handover details including business name, customer, reason
 */
export async function notifyStaffTelegram(
  chatId: string,
  notification: HandoverNotification
): Promise<void> {
  const reasonLabel =
    REASON_LABELS[notification.reason] || notification.reason;

  const message = `
🔔 <b>Handover Alert - ${notification.businessName}</b>

<b>Customer:</b> ${notification.customerName}
<b>Reason:</b> ${reasonLabel}

<b>Message:</b>
${notification.messagePreview}

${notification.conversationUrl ? `<a href="${notification.conversationUrl}">Open Conversation</a>` : ""}
`.trim();

  await sendTelegramMessage(chatId, message);
}
