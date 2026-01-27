import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMessages } from "./messages";

// Mock Supabase client
const mockMessagesEq = vi.fn();
const mockMessagesOrder = vi.fn(() => ({ limit: vi.fn(() => ({ then: vi.fn() })) }));
const mockMessagesLimit = vi.fn();
const mockMessagesLt = vi.fn();
const mockMessagesSelect = vi.fn();

const mockConvSingle = vi.fn();
const mockConvEq2 = vi.fn(() => ({ single: mockConvSingle }));
const mockConvEq = vi.fn(() => ({ eq: mockConvEq2 }));
const mockConvSelect = vi.fn(() => ({ eq: mockConvEq }));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn((table: string) => {
    if (table === "conversations") {
      return { select: mockConvSelect };
    }
    // messages table
    return {
      select: mockMessagesSelect,
    };
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("getMessages", () => {
  const validConversationId = "123e4567-e89b-12d3-a456-426614174000";
  const tenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset chain mocks for messages query
    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    });
  });

  it("returns VALIDATION_ERROR for invalid conversation ID", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    const result = await getMessages("invalid-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe("Invalid conversation ID format");
    }
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const result = await getMessages(validConversationId);

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

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FORBIDDEN");
      expect(result.error.message).toBe("No business associated");
    }
  });

  it("returns NOT_FOUND when conversation doesn't exist or belongs to different tenant", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("Conversation not found");
    }
  });

  it("returns messages for valid conversation", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: { id: validConversationId },
      error: null,
    });

    const mockMessages = [
      {
        id: "msg-1",
        conversation_id: validConversationId,
        sender_type: "customer",
        content: "Hello",
        created_at: "2026-01-15T10:30:00Z",
        is_handover_trigger: false,
      },
      {
        id: "msg-2",
        conversation_id: validConversationId,
        sender_type: "bot",
        content: "Hi there!",
        created_at: "2026-01-15T10:31:00Z",
        is_handover_trigger: false,
      },
    ];

    // Setup messages query chain
    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockMessages, error: null })),
          })),
        })),
      })),
    });

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(2);
      expect(result.data.messages[0].content).toBe("Hello");
      expect(result.data.messages[0].senderType).toBe("customer");
      expect(result.data.messages[1].content).toBe("Hi there!");
      expect(result.data.messages[1].senderType).toBe("bot");
      expect(result.data.nextCursor).toBeNull();
    }
  });

  it("respects pagination cursor", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: { id: validConversationId },
      error: null,
    });

    const mockMessagesPage1 = [
      {
        id: "msg-1",
        conversation_id: validConversationId,
        sender_type: "customer",
        content: "Older message",
        created_at: "2026-01-15T09:30:00Z",
        is_handover_trigger: false,
      },
    ];

    const mockLtFn = vi.fn(() => Promise.resolve({ data: mockMessagesPage1, error: null }));
    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              lt: mockLtFn,
            })),
          })),
        })),
      })),
    });

    const cursor = "2026-01-15T10:30:00Z";
    const result = await getMessages(validConversationId, cursor);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(1);
    }
  });

  it("returns nextCursor when there are more messages", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: { id: validConversationId },
      error: null,
    });

    // Create 31 messages (limit + 1) to indicate more exist
    const mockMessages = Array.from({ length: 31 }, (_, i) => ({
      id: `msg-${i}`,
      conversation_id: validConversationId,
      sender_type: "customer",
      content: `Message ${i}`,
      created_at: `2026-01-15T10:${String(30 - i).padStart(2, "0")}:00Z`,
      is_handover_trigger: false,
    }));

    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockMessages, error: null })),
          })),
        })),
      })),
    });

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(30); // Limited to 30
      expect(result.data.nextCursor).not.toBeNull();
    }
  });

  it("handles database errors gracefully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: { id: validConversationId },
      error: null,
    });

    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        })),
      })),
    });

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SERVER_ERROR");
      expect(result.error.message).toBe("Failed to load messages");
    }
  });

  it("parses sender_type correctly using Zod validation", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { tenant_id: tenantId } } },
      error: null,
    });

    mockConvSingle.mockResolvedValue({
      data: { id: validConversationId },
      error: null,
    });

    const mockMessages = [
      {
        id: "msg-1",
        conversation_id: validConversationId,
        sender_type: "owner", // Valid type
        content: "Owner message",
        created_at: "2026-01-15T10:30:00Z",
        is_handover_trigger: false,
      },
      {
        id: "msg-2",
        conversation_id: validConversationId,
        sender_type: "invalid_type", // Invalid type - should default to "customer"
        content: "Unknown sender",
        created_at: "2026-01-15T10:31:00Z",
        is_handover_trigger: false,
      },
    ];

    mockMessagesSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockMessages, error: null })),
          })),
        })),
      })),
    });

    const result = await getMessages(validConversationId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages[0].senderType).toBe("owner");
      expect(result.data.messages[1].senderType).toBe("customer"); // Fallback
    }
  });
});
