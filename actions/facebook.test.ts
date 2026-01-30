import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectFacebookPage, getFacebookStatus, disconnectFacebookPage } from "./facebook";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null,
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock encryption
vi.mock("@/lib/encryption", () => ({
  encryptToken: vi.fn((token) => `encrypted:${token}`),
  decryptToken: vi.fn((encrypted) => encrypted.replace("encrypted:", "")),
  decryptCookieData: vi.fn((encrypted) => JSON.parse(encrypted.replace("encrypted:", ""))),
}));

// Mock Facebook client
vi.mock("@/lib/facebook/client", () => ({
  subscribeWebhook: vi.fn(),
  unsubscribeWebhook: vi.fn(),
}));

describe("selectFacebookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await selectFacebookPage("page-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await selectFacebookPage("page-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns NOT_FOUND when no pending pages cookie", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockCookies.get.mockReturnValue(undefined);

    const result = await selectFacebookPage("page-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("returns VALIDATION_ERROR when pending pages expired", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const expiredPages = {
      pages: [{ id: "page-id", name: "Test Page", access_token: "token" }],
      expiresAt: Date.now() - 1000, // Expired
    };

    // Cookie value is "encrypted:" + JSON to match the mock
    mockCookies.get.mockReturnValue({
      value: "encrypted:" + JSON.stringify(expiredPages),
    });

    const result = await selectFacebookPage("page-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("expired");
    }
  });

  it("returns NOT_FOUND when page not in pending list", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const pendingPages = {
      pages: [{ id: "other-page", name: "Other Page", access_token: "token" }],
      expiresAt: Date.now() + 60000,
    };

    // Cookie value is "encrypted:" + JSON to match the mock
    mockCookies.get.mockReturnValue({
      value: "encrypted:" + JSON.stringify(pendingPages),
    });

    const result = await selectFacebookPage("page-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});

describe("getFacebookStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getFacebookStatus();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await getFacebookStatus();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns connected status when page is connected", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              facebook_page_id: "page-123",
              facebook_page_name: "My Business",
              facebook_page_avatar_url: "https://example.com/pic.jpg",
              facebook_connected_at: "2026-01-28T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await getFacebookStatus();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isConnected).toBe(true);
      expect(result.data.pageId).toBe("page-123");
      expect(result.data.pageName).toBe("My Business");
    }
  });

  it("returns disconnected status when no page connected", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              facebook_page_id: null,
              facebook_page_name: null,
              facebook_page_avatar_url: null,
              facebook_connected_at: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await getFacebookStatus();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isConnected).toBe(false);
      expect(result.data.pageId).toBeNull();
    }
  });
});

describe("disconnectFacebookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await disconnectFacebookPage();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: {},
        },
      },
      error: null,
    });

    const result = await disconnectFacebookPage();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns NOT_FOUND when no connection exists", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              facebook_page_id: null,
              facebook_access_token: null,
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await disconnectFacebookPage();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("successfully disconnects: nullifies all 5 fields, calls unsubscribeWebhook, revalidates paths", async () => {
    const { revalidatePath } = await import("next/cache");
    const { unsubscribeWebhook } = await import("@/lib/facebook/client");

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    // First call: select (fetch business), Second call: update (clear fields)
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  facebook_page_id: "page-123",
                  facebook_access_token: "encrypted:test-token",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return { update: mockUpdate };
    });

    const result = await disconnectFacebookPage();

    expect(result.success).toBe(true);
    expect(unsubscribeWebhook).toHaveBeenCalledWith("page-123", "test-token");
    expect(mockUpdate).toHaveBeenCalledWith({
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_avatar_url: null,
      facebook_access_token: null,
      facebook_connected_at: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/facebook");
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("still clears DB fields when unsubscribe fails (graceful degradation)", async () => {
    const { unsubscribeWebhook } = await import("@/lib/facebook/client");
    vi.mocked(unsubscribeWebhook).mockRejectedValue(new Error("Network error"));

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  facebook_page_id: "page-123",
                  facebook_access_token: "encrypted:test-token",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return { update: mockUpdate };
    });

    const result = await disconnectFacebookPage();

    // Should still succeed even though unsubscribe failed
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_avatar_url: null,
      facebook_access_token: null,
      facebook_connected_at: null,
    });
  });

  it("returns SERVER_ERROR when DB update fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          app_metadata: { tenant_id: "tenant-id" },
        },
      },
      error: null,
    });

    const mockEq = vi.fn().mockResolvedValue({ error: { message: "DB error" } });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  facebook_page_id: "page-123",
                  facebook_access_token: "encrypted:test-token",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return { update: mockUpdate };
    });

    const result = await disconnectFacebookPage();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
    }
  });
});
