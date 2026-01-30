/**
 * Tests for Messenger Retry Logic
 * Story 4.3: Send Automated Responses via Messenger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendWithRetry } from "./retry";
import type { SendResult } from "@/types/messenger";

describe("sendWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return success on first attempt if sender succeeds", async () => {
    const successResult: SendResult = {
      success: true,
      messageId: "mid.123",
    };
    const sender = vi.fn().mockResolvedValue(successResult);

    const resultPromise = sendWithRetry(sender, 3);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe("mid.123");
    }
    expect(sender).toHaveBeenCalledTimes(1);
  });

  it("should retry and succeed on second attempt", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Temporary error" },
    };
    const successResult: SendResult = {
      success: true,
      messageId: "mid.456",
    };
    const sender = vi
      .fn()
      .mockResolvedValueOnce(failResult)
      .mockResolvedValueOnce(successResult);

    const resultPromise = sendWithRetry(sender, 3);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe("mid.456");
    }
    expect(sender).toHaveBeenCalledTimes(2);
  });

  it("should exhaust all retries and return last error", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Persistent error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender, 3);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Persistent error");
    }
    expect(sender).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff delays: 1s, 2s", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender, 3);

    // First attempt happens immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(sender).toHaveBeenCalledTimes(1);

    // After 1s delay, second attempt
    await vi.advanceTimersByTimeAsync(1000);
    expect(sender).toHaveBeenCalledTimes(2);

    // After 2s delay, third attempt
    await vi.advanceTimersByTimeAsync(2000);
    expect(sender).toHaveBeenCalledTimes(3);

    await resultPromise;
  });

  it("should handle rate limit error (code 613) with 60s cooldown", async () => {
    const rateLimitResult: SendResult = {
      success: false,
      error: { code: 613, message: "Rate limit exceeded" },
    };
    const successResult: SendResult = {
      success: true,
      messageId: "mid.789",
    };
    const sender = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResult)
      .mockResolvedValueOnce(successResult);

    const resultPromise = sendWithRetry(sender, 3);

    // First attempt - rate limited
    await vi.advanceTimersByTimeAsync(0);
    expect(sender).toHaveBeenCalledTimes(1);

    // Should wait 60 seconds, not the normal 1 second
    await vi.advanceTimersByTimeAsync(1000);
    expect(sender).toHaveBeenCalledTimes(1); // Still 1

    // After 60s, should retry
    await vi.advanceTimersByTimeAsync(59000);
    expect(sender).toHaveBeenCalledTimes(2);

    const result = await resultPromise;
    expect(result.success).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [MESSENGER] Rate limited, waiting 60s"
    );
  });

  it("should log retry attempts with correct context", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender, 3);
    await vi.runAllTimersAsync();
    await resultPromise;

    // Should log retry info for attempts 1 and 2 (not after attempt 3)
    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [MESSENGER] Retry attempt:",
      { attempt: 1, nextIn: 1000 }
    );
    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [MESSENGER] Retry attempt:",
      { attempt: 2, nextIn: 2000 }
    );
  });

  it("should log error when all retries exhausted", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender, 3);
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [MESSENGER] All retries exhausted"
    );
  });

  it("should respect maxRetries parameter", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender, 2);
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(sender).toHaveBeenCalledTimes(2);
  });

  it("should default to 3 retries when not specified", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    const resultPromise = sendWithRetry(sender);
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(sender).toHaveBeenCalledTimes(3);
  });

  it("should cap backoff delay at 4 seconds", async () => {
    const failResult: SendResult = {
      success: false,
      error: { code: 100, message: "Error" },
    };
    const sender = vi.fn().mockResolvedValue(failResult);

    // With 5 retries, delays would be 1s, 2s, 4s, 8s but should cap at 4s
    const resultPromise = sendWithRetry(sender, 5);

    await vi.advanceTimersByTimeAsync(0); // attempt 1
    await vi.advanceTimersByTimeAsync(1000); // 1s delay -> attempt 2
    await vi.advanceTimersByTimeAsync(2000); // 2s delay -> attempt 3
    await vi.advanceTimersByTimeAsync(4000); // 4s delay (capped) -> attempt 4
    await vi.advanceTimersByTimeAsync(4000); // 4s delay (capped) -> attempt 5

    await resultPromise;
    expect(sender).toHaveBeenCalledTimes(5);
  });
});
