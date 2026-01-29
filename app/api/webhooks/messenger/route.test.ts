/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    FACEBOOK_VERIFY_TOKEN: "test_verify_token",
    FACEBOOK_APP_SECRET: "test_app_secret",
  },
}));

// Mock process module
vi.mock("@/lib/messenger/process", () => ({
  processIncomingMessage: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "./route";
import { processIncomingMessage } from "@/lib/messenger/process";

describe("Messenger Webhook Route", () => {
  const appSecret = "test_app_secret";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET (verification)", () => {
    it("should return challenge on successful verification", async () => {
      const url = new URL("http://localhost/api/webhooks/messenger");
      url.searchParams.set("hub.mode", "subscribe");
      url.searchParams.set("hub.verify_token", "test_verify_token");
      url.searchParams.set("hub.challenge", "CHALLENGE_123");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("CHALLENGE_123");
    });

    it("should return 403 on invalid token", async () => {
      const url = new URL("http://localhost/api/webhooks/messenger");
      url.searchParams.set("hub.mode", "subscribe");
      url.searchParams.set("hub.verify_token", "wrong_token");
      url.searchParams.set("hub.challenge", "CHALLENGE_123");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should return 400 on missing parameters", async () => {
      const url = new URL("http://localhost/api/webhooks/messenger");
      url.searchParams.set("hub.mode", "subscribe");
      // Missing verify_token and challenge

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should return 403 on wrong mode", async () => {
      const url = new URL("http://localhost/api/webhooks/messenger");
      url.searchParams.set("hub.mode", "unsubscribe");
      url.searchParams.set("hub.verify_token", "test_verify_token");
      url.searchParams.set("hub.challenge", "CHALLENGE_123");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should return 500 when FACEBOOK_VERIFY_TOKEN is not configured", async () => {
      // Temporarily override env mock
      const envModule = await import("@/lib/env");
      const originalToken = envModule.env.FACEBOOK_VERIFY_TOKEN;
      (envModule.env as { FACEBOOK_VERIFY_TOKEN: string | undefined }).FACEBOOK_VERIFY_TOKEN = undefined;

      const url = new URL("http://localhost/api/webhooks/messenger");
      url.searchParams.set("hub.mode", "subscribe");
      url.searchParams.set("hub.verify_token", "any_token");
      url.searchParams.set("hub.challenge", "CHALLENGE_123");

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe("Server configuration error");

      // Restore
      (envModule.env as { FACEBOOK_VERIFY_TOKEN: string | undefined }).FACEBOOK_VERIFY_TOKEN = originalToken;
    });
  });

  describe("POST (message reception)", () => {
    const validPayload = JSON.stringify({
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
                text: "Hello!",
              },
            },
          ],
        },
      ],
    });

    function createSignature(body: string): string {
      return "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");
    }

    it("should return 200 and process message with valid signature", async () => {
      const signature = createSignature(validPayload);

      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: validPayload,
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("EVENT_RECEIVED");

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(processIncomingMessage).toHaveBeenCalled();
    });

    it("should return 403 with invalid signature", async () => {
      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: validPayload,
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": "sha256=invalid_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(processIncomingMessage).not.toHaveBeenCalled();
    });

    it("should return 403 with missing signature", async () => {
      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: validPayload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it("should return 400 with invalid JSON body", async () => {
      const invalidBody = "not valid json";
      const signature = createSignature(invalidBody);

      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: invalidBody,
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 200 even when async processing fails", async () => {
      vi.mocked(processIncomingMessage).mockRejectedValueOnce(
        new Error("Database error")
      );

      const signature = createSignature(validPayload);

      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: validPayload,
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
      });

      const response = await POST(request);

      // Should still return 200 - async errors don't affect response
      expect(response.status).toBe(200);
    });

    it("should not process non-message events", async () => {
      const deliveryPayload = JSON.stringify({
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
                delivery: {
                  mids: ["mid.1234"],
                  watermark: 1234567890000,
                },
              },
            ],
          },
        ],
      });

      const signature = createSignature(deliveryPayload);

      const request = new NextRequest("http://localhost/api/webhooks/messenger", {
        method: "POST",
        body: deliveryPayload,
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not call processIncomingMessage for delivery events
      expect(processIncomingMessage).not.toHaveBeenCalled();
    });
  });
});
