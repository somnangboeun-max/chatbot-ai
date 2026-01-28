import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    FACEBOOK_APP_ID: "test-app-id",
    FACEBOOK_APP_SECRET: "test-app-secret",
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  exchangeCodeForToken,
  fetchUserPages,
  subscribeWebhook,
  unsubscribeWebhook,
} from "./client";

describe("exchangeCodeForToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code for token successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "user-access-token" }),
    });

    const token = await exchangeCodeForToken(
      "auth-code",
      "http://localhost:3000/callback"
    );

    expect(token).toBe("user-access-token");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/oauth/access_token?")
    );
  });

  it("throws error when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: "Invalid code", code: 100 },
        }),
    });

    await expect(
      exchangeCodeForToken("bad-code", "http://localhost:3000/callback")
    ).rejects.toThrow("Invalid code");
  });

  it("throws error when no access_token in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await expect(
      exchangeCodeForToken("code", "http://localhost:3000/callback")
    ).rejects.toThrow("No access token received");
  });
});

describe("fetchUserPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches pages successfully", async () => {
    const mockPages = [
      {
        id: "page-1",
        name: "Test Page",
        access_token: "page-token",
        picture: { data: { url: "https://example.com/pic.jpg" } },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockPages }),
    });

    const pages = await fetchUserPages("user-token");

    expect(pages).toEqual(mockPages);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/me/accounts?")
    );
  });

  it("returns empty array when no pages", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const pages = await fetchUserPages("user-token");

    expect(pages).toEqual([]);
  });

  it("throws error when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: "Invalid token", code: 190 },
        }),
    });

    await expect(fetchUserPages("bad-token")).rejects.toThrow("Invalid token");
  });
});

describe("subscribeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to webhook successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await expect(
      subscribeWebhook("page-id", "page-token")
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/page-id/subscribed_apps?"),
      { method: "POST" }
    );
  });

  it("throws error when subscription fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: "Permission denied" },
        }),
    });

    await expect(subscribeWebhook("page-id", "page-token")).rejects.toThrow(
      "Permission denied"
    );
  });
});

describe("unsubscribeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes from webhook successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await expect(
      unsubscribeWebhook("page-id", "page-token")
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/page-id/subscribed_apps?"),
      { method: "DELETE" }
    );
  });

  it("does not throw when unsubscribe fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: "Failed" },
        }),
    });

    // Should not throw - just logs warning
    await expect(
      unsubscribeWebhook("page-id", "page-token")
    ).resolves.toBeUndefined();
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Should not throw - just logs warning
    await expect(
      unsubscribeWebhook("page-id", "page-token")
    ).resolves.toBeUndefined();
  });
});
