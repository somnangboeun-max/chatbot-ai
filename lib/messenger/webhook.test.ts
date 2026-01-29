/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseWebhookPayload } from "./webhook";
import type { MessengerWebhookPayload } from "@/types/messenger";

describe("parseWebhookPayload", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse valid message payload", () => {
    const payload: MessengerWebhookPayload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "USER_123" },
              recipient: { id: "PAGE_456" },
              timestamp: 1234567890000,
              message: {
                mid: "mid.1234",
                text: "Hello bot!",
              },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({
      senderId: "USER_123",
      recipientId: "PAGE_456",
      timestamp: 1234567890000,
      messageText: "Hello bot!",
      messageId: "mid.1234",
    });
  });

  it("should parse multiple messages from single entry", () => {
    const payload: MessengerWebhookPayload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "USER_1" },
              recipient: { id: "PAGE_ID" },
              timestamp: 1000,
              message: { mid: "mid.1", text: "First message" },
            },
            {
              sender: { id: "USER_2" },
              recipient: { id: "PAGE_ID" },
              timestamp: 2000,
              message: { mid: "mid.2", text: "Second message" },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);

    expect(messages).toHaveLength(2);
    expect(messages[0].messageText).toBe("First message");
    expect(messages[1].messageText).toBe("Second message");
  });

  it("should ignore echo messages", () => {
    const payload: MessengerWebhookPayload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "PAGE_ID" },
              recipient: { id: "USER_123" },
              timestamp: 1234567890000,
              message: {
                mid: "mid.echo",
                text: "Bot response",
                is_echo: true,
              },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should ignore delivery receipts", () => {
    const payload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "USER_123" },
              recipient: { id: "PAGE_ID" },
              timestamp: 1234567890000,
              delivery: {
                mids: ["mid.1234"],
                watermark: 1234567890000,
              },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should ignore read receipts", () => {
    const payload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "USER_123" },
              recipient: { id: "PAGE_ID" },
              timestamp: 1234567890000,
              read: {
                watermark: 1234567890000,
              },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should ignore messages without text (attachments only)", () => {
    const payload: MessengerWebhookPayload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "USER_123" },
              recipient: { id: "PAGE_ID" },
              timestamp: 1234567890000,
              message: {
                mid: "mid.attachment",
                attachments: [
                  {
                    type: "image",
                    payload: { url: "https://example.com/image.jpg" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should handle non-page webhook", () => {
    const payload = {
      object: "user",
      entry: [],
    };

    const messages = parseWebhookPayload(payload);

    expect(messages).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] Non-page webhook received:",
      { object: "user" }
    );
  });

  it("should handle malformed payload gracefully", () => {
    const payload = { invalid: "data" };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should handle null payload gracefully", () => {
    const messages = parseWebhookPayload(null);
    expect(messages).toHaveLength(0);
  });

  it("should handle undefined payload gracefully", () => {
    const messages = parseWebhookPayload(undefined);
    expect(messages).toHaveLength(0);
  });

  it("should handle missing entry array", () => {
    const payload = {
      object: "page",
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should handle missing messaging array in entry", () => {
    const payload = {
      object: "page",
      entry: [{ id: "PAGE_ID", time: 1234567890 }],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });

  it("should skip messages with missing required fields", () => {
    const payload: MessengerWebhookPayload = {
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: 1234567890,
          messaging: [
            {
              sender: { id: "" }, // Empty sender
              recipient: { id: "PAGE_ID" },
              timestamp: 1234567890000,
              message: { mid: "mid.1", text: "Test" },
            },
          ],
        },
      ],
    };

    const messages = parseWebhookPayload(payload);
    expect(messages).toHaveLength(0);
  });
});
