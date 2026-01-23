import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleBotStatus } from "./bot";

// Mock Supabase client
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    update: mockUpdate,
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("toggleBotStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const result = await toggleBotStatus(true);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Not authenticated");
    }
  });

  it("returns FORBIDDEN when user has no tenant_id", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: {} } },
      error: null,
    });

    const result = await toggleBotStatus(true);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
      expect(result.error.message).toBe("No business associated");
    }
  });

  it("successfully pauses bot", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          app_metadata: { tenant_id: "tenant-1" },
        },
      },
      error: null,
    });

    const now = "2026-01-23T10:00:00.000Z";
    mockSingle.mockResolvedValue({
      data: { bot_active: false, bot_paused_at: now },
      error: null,
    });

    const result = await toggleBotStatus(false);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.botActive).toBe(false);
      expect(result.data.pausedAt).toBe(now);
    }

    expect(mockSupabase.from).toHaveBeenCalledWith("businesses");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        bot_active: false,
        bot_paused_at: expect.any(String),
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "tenant-1");
    expect(mockSelect).toHaveBeenCalledWith("bot_active, bot_paused_at");
  });

  it("successfully resumes bot", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          app_metadata: { tenant_id: "tenant-1" },
        },
      },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: { bot_active: true, bot_paused_at: null },
      error: null,
    });

    const result = await toggleBotStatus(true);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.botActive).toBe(true);
      expect(result.data.pausedAt).toBeNull();
    }

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        bot_active: true,
        bot_paused_at: null,
      }),
    );
  });

  it("returns SERVER_ERROR on database failure", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          app_metadata: { tenant_id: "tenant-1" },
        },
      },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const result = await toggleBotStatus(true);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
      expect(result.error.message).toBe("Failed to update bot status");
    }
  });
});
