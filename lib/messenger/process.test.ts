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

// Mock processAndRespond
const mockProcessAndRespond = vi.fn();
vi.mock("./respond", () => ({
  processAndRespond: (...args: unknown[]) => mockProcessAndRespond(...args),
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
    mockProcessAndRespond.mockResolvedValue(undefined);
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

  it("should return early for disconnected page (no facebook_page_id match) and not send any response (Story 4.4 AC#3)", async () => {
    // After disconnect, facebook_page_id is null in DB, so no business matches
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

    // Should NOT throw - returns gracefully
    await processIncomingMessage(testMessage);

    // Should log a warning, NOT an error
    expect(console.warn).toHaveBeenCalledWith(
      "[WARN] [WEBHOOK] No business found for page:",
      { pageId: "PAGE_456" }
    );
    expect(console.error).not.toHaveBeenCalled();

    // Should NOT attempt to create conversations or store messages
    expect(mockFrom).toHaveBeenCalledTimes(1); // Only businesses table lookup
    expect(mockFrom).toHaveBeenCalledWith("businesses");

    // Should NOT trigger any automated response
    expect(mockProcessAndRespond).not.toHaveBeenCalled();
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

  it("should trigger processAndRespond when bot is active (Story 4.3)", async () => {
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

    // Allow microtasks to run for fire-and-forget Promise
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockProcessAndRespond).toHaveBeenCalledWith(
      mockBusiness.id,
      mockConversation.id,
      testMessage.messageText
    );

    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [WEBHOOK] Bot response queued:",
      { conversationId: mockConversation.id }
    );
  });

  it("should NOT trigger processAndRespond when bot is paused", async () => {
    const pausedBusiness = { ...mockBusiness, bot_active: false };

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

    // Allow microtasks to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockProcessAndRespond).not.toHaveBeenCalled();
  });

  it("should handle processAndRespond errors gracefully", async () => {
    mockProcessAndRespond.mockRejectedValue(new Error("Response failed"));

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

    // Should not throw - fire and forget error handling
    await processIncomingMessage(testMessage);

    // Allow microtasks to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [WEBHOOK] Response processing failed:",
      expect.objectContaining({
        conversationId: mockConversation.id,
        error: "Response failed",
      })
    );
  });
});
