/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ParsedMessage } from "@/types/messenger";

// Mock the admin client
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

import { processIncomingMessage } from "./process";

describe("processIncomingMessage", () => {
  const testMessage: ParsedMessage = {
    senderId: "USER_123",
    recipientId: "PAGE_456",
    timestamp: 1234567890000,
    messageText: "Hello bot!",
    messageId: "mid.1234",
  };

  const mockBusiness = {
    id: "tenant-uuid-123",
    bot_active: true,
    facebook_page_id: "PAGE_456",
  };

  const mockConversation = {
    id: "convo-uuid-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create new conversation if none exists", async () => {
    // Setup mocks
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockConversation, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "messages") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {};
    });

    await processIncomingMessage(testMessage);

    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Created conversation:",
      expect.objectContaining({ conversationId: "convo-uuid-123" })
    );
    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Message stored:",
      expect.objectContaining({ conversationId: "convo-uuid-123" })
    );
  });

  it("should skip duplicate messages based on facebook_message_id", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockConversation, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "messages") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "existing-msg-id" }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    await processIncomingMessage(testMessage);

    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Duplicate message skipped:",
      { messageId: "mid.1234" }
    );
    // Should not log "Message stored" for duplicates
    expect(console.info).not.toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Message stored:",
      expect.anything()
    );
  });

  it("should use existing conversation if found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockConversation, error: null }),
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "messages") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {};
    });

    await processIncomingMessage(testMessage);

    // Should not log "Created conversation"
    expect(console.info).not.toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Created conversation:",
      expect.anything()
    );
    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Message stored:",
      expect.objectContaining({ conversationId: "convo-uuid-123" })
    );
  });

  it("should mark conversation as needs_attention when bot is paused", async () => {
    const pausedBusiness = { ...mockBusiness, bot_active: false };
    let updateCalled = false;
    let updateData: Record<string, unknown> = {};

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: pausedBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockConversation, error: null }),
            }),
          }),
          update: (data: Record<string, unknown>) => {
            updateCalled = true;
            updateData = data;
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      if (table === "messages") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {};
    });

    await processIncomingMessage(testMessage);

    expect(updateCalled).toBe(true);
    expect(updateData.status).toBe("needs_attention");
  });

  it("should return early if no business found for page", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        };
      }
      return {};
    });

    await processIncomingMessage(testMessage);

    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] No business found for page:",
      { pageId: "PAGE_456" }
    );
  });

  it("should throw error if conversation creation fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Database error", code: "23505" },
                }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(processIncomingMessage(testMessage)).rejects.toThrow();
  });

  it("should throw error if message insertion fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBusiness, error: null }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockConversation, error: null }),
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "messages") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
          insert: () =>
            Promise.resolve({
              error: { message: "Insert failed", code: "23503" },
            }),
        };
      }
      return {};
    });

    await expect(processIncomingMessage(testMessage)).rejects.toThrow();
  });
});
