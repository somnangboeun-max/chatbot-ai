/**
 * Tests for Facebook Messenger Send API
 * Story 4.3: Send Automated Responses via Messenger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessage } from "./send";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sendMessage", () => {
  const pageAccessToken = "test_page_token_123";
  const pageId = "page_111";
  const recipientId = "987654321";
  const messageText = "Hello, customer!";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send message successfully and return messageId", async () => {
    const mockMessageId = "mid.1234567890";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recipient_id: recipientId,
        message_id: mockMessageId,
      }),
    });

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe(mockMessageId);
    }

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://graph.facebook.com/v19.0/${pageId}/messages`);
    expect(url).not.toContain("access_token");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${pageAccessToken}`,
    });

    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      recipient: { id: recipientId },
      message: { text: messageText },
      messaging_type: "RESPONSE",
    });
  });

  it("should handle API error response", async () => {
    const errorCode = 100;
    const errorMessage = "Invalid recipient";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          code: errorCode,
          message: errorMessage,
        },
      }),
    });

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({
        code: errorCode,
        message: errorMessage,
      });
    }
  });

  it("should handle rate limit error (code 613)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          code: 613,
          message: "Rate limit exceeded",
        },
      }),
    });

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(613);
      expect(result.error.message).toBe("Rate limit exceeded");
    }
  });

  it("should handle network error", async () => {
    const networkError = new Error("Network request failed");
    mockFetch.mockRejectedValueOnce(networkError);

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({
        code: -1,
        message: "Network request failed",
      });
    }
  });

  it("should handle unknown error type", async () => {
    mockFetch.mockRejectedValueOnce("Unknown error string");

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({
        code: -1,
        message: "Network error",
      });
    }
  });

  it("should handle API response with missing error details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const result = await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({
        code: 0,
        message: "Unknown error",
      });
    }
  });

  it("should log success message with correct context", async () => {
    const mockMessageId = "mid.9999";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recipient_id: recipientId,
        message_id: mockMessageId,
      }),
    });

    await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [MESSENGER] Sent:",
      expect.objectContaining({
        recipientId,
        messageId: mockMessageId,
      })
    );
  });

  it("should log error message on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: 123, message: "Test error" },
      }),
    });

    await sendMessage(pageAccessToken, pageId, recipientId, messageText);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [MESSENGER] Send failed:",
      expect.objectContaining({
        code: 123,
        message: "Test error",
      })
    );
  });
});
