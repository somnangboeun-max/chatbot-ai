import { env } from "@/lib/env";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
}

/**
 * Send a message via Telegram Bot API
 *
 * @param chatId - Telegram chat ID (numeric) or username (with @)
 * @param text - Message text (supports HTML formatting)
 * @throws Error if sending fails or TELEGRAM_BOT_TOKEN is not configured
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("[ERROR] [TELEGRAM] Bot token not configured");
    throw new Error("Telegram bot is not configured");
  }

  const url = `${TELEGRAM_API_BASE}${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data: TelegramResponse = await response.json();

  if (!data.ok) {
    console.error("[ERROR] [TELEGRAM] API error:", {
      chatId,
      errorCode: data.error_code,
      description: data.description,
    });
    throw new Error(data.description || "Telegram API error");
  }

  console.info("[INFO] [TELEGRAM] Message sent:", { chatId });
}
