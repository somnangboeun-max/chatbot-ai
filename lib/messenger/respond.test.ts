/**
 * Tests for Response Processing Service
 * Story 4.3: Send Automated Responses via Messenger
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { processAndRespond } from "./respond";

// Mock modules
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/encryption", () => ({
  decryptToken: vi.fn(),
}));

vi.mock("./send", () => ({
  sendMessage: vi.fn(),
}));

vi.mock("./retry", () => ({
  sendWithRetry: vi.fn(),
}));

vi.mock("@/lib/bot/templates", () => ({
  getDefaultResponse: vi.fn(() => "សួស្តី! សូមអរគុណសម្រាប់សារ។"),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/encryption";
import { sendWithRetry } from "./retry";

describe("processAndRespond", () => {
  const tenantId = "tenant-123";
  const conversationId = "convo-456";
  const customerMessage = "What are your prices?";
  const facebookSenderId = "fb-sender-789";
  const encryptedToken = "encrypted-token-xyz";
  const decryptedToken = "decrypted-page-access-token";

  let mockSupabase: {
    from: Mock;
  };
  let mockBusinessQuery: {
    select: Mock;
    eq: Mock;
    single: Mock;
  };
  let mockConversationQuery: {
    select: Mock;
    eq: Mock;
    single: Mock;
    update: Mock;
  };
  let mockMessageInsert: {
    insert: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Setup Supabase mock chain
    mockBusinessQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockConversationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    };

    mockMessageInsert = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "businesses") return mockBusinessQuery;
        if (table === "conversations") return mockConversationQuery;
        if (table === "messages") return mockMessageInsert;
        return mockBusinessQuery;
      }),
    };

    (createAdminClient as Mock).mockReturnValue(mockSupabase);
    (decryptToken as Mock).mockReturnValue(decryptedToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should process and send response successfully", async () => {
    // Setup mocks for success flow
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    mockConversationQuery.single.mockResolvedValue({
      data: { facebook_sender_id: facebookSenderId },
      error: null,
    });

    (sendWithRetry as Mock).mockResolvedValue({
      success: true,
      messageId: "mid.12345",
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    // Verify business lookup
    expect(mockSupabase.from).toHaveBeenCalledWith("businesses");
    expect(mockBusinessQuery.select).toHaveBeenCalledWith(
      "facebook_access_token, facebook_page_id"
    );
    expect(mockBusinessQuery.eq).toHaveBeenCalledWith("id", tenantId);

    // Verify token decryption
    expect(decryptToken).toHaveBeenCalledWith(encryptedToken);

    // Verify conversation lookup
    expect(mockSupabase.from).toHaveBeenCalledWith("conversations");

    // Verify send was called
    expect(sendWithRetry).toHaveBeenCalled();

    // Verify message storage
    expect(mockSupabase.from).toHaveBeenCalledWith("messages");
    expect(mockMessageInsert.insert).toHaveBeenCalledWith({
      tenant_id: tenantId,
      conversation_id: conversationId,
      sender_type: "bot",
      content: "សួស្តី! សូមអរគុណសម្រាប់សារ។",
      facebook_message_id: "mid.12345",
    });

    expect(console.info).toHaveBeenCalledWith(
      "[INFO] [RESPOND] Bot message stored:",
      { conversationId }
    );
  });

  it("should handle missing business access token", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: { facebook_access_token: null },
      error: null,
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] No access token or page ID for tenant:",
      expect.objectContaining({ tenantId })
    );
    expect(sendWithRetry).not.toHaveBeenCalled();
  });

  it("should handle business lookup error", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Business not found" },
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] No access token or page ID for tenant:",
      expect.objectContaining({ tenantId, error: "Business not found" })
    );
    expect(sendWithRetry).not.toHaveBeenCalled();
  });

  it("should handle token decryption failure and escalate", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    (decryptToken as Mock).mockImplementation(() => {
      throw new Error("Decryption failed");
    });

    mockConversationQuery.update.mockReturnThis();
    mockConversationQuery.eq.mockResolvedValue({ error: null });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Token decryption failed:",
      expect.objectContaining({ tenantId, error: "Decryption failed" })
    );

    // Should escalate conversation
    expect(mockSupabase.from).toHaveBeenCalledWith("conversations");
  });

  it("should handle conversation not found", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    mockConversationQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Conversation not found:",
      expect.objectContaining({ conversationId })
    );
    expect(sendWithRetry).not.toHaveBeenCalled();
  });

  it("should handle missing facebook_sender_id", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    mockConversationQuery.single.mockResolvedValue({
      data: { facebook_sender_id: null },
      error: null,
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Conversation not found:",
      expect.objectContaining({ conversationId })
    );
    expect(sendWithRetry).not.toHaveBeenCalled();
  });

  it("should escalate conversation when send fails after retries", async () => {
    // Need separate mock chains for the two different conversation queries
    let conversationCallCount = 0;

    const mockConversationSelectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { facebook_sender_id: facebookSenderId },
        error: null,
      }),
    };

    const mockConversationUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "businesses") return mockBusinessQuery;
      if (table === "conversations") {
        conversationCallCount++;
        // First call is select, subsequent calls are updates
        if (conversationCallCount === 1) {
          return mockConversationSelectChain;
        }
        return mockConversationUpdateChain;
      }
      if (table === "messages") return mockMessageInsert;
      return mockBusinessQuery;
    });

    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    (sendWithRetry as Mock).mockResolvedValue({
      success: false,
      error: { code: 100, message: "Send failed" },
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Send failed, escalating:",
      expect.objectContaining({ conversationId })
    );

    // Verify conversation status update was called
    expect(mockConversationUpdateChain.update).toHaveBeenCalledWith({ status: "needs_attention" });
  });

  it("should handle message storage failure gracefully", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    mockConversationQuery.single.mockResolvedValue({
      data: { facebook_sender_id: facebookSenderId },
      error: null,
    });

    (sendWithRetry as Mock).mockResolvedValue({
      success: true,
      messageId: "mid.12345",
    });

    mockMessageInsert.insert.mockResolvedValue({
      error: { message: "Insert failed" },
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    // Should still complete, just log error
    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Failed to store bot message:",
      expect.objectContaining({
        conversationId,
        error: "Insert failed",
      })
    );
  });

  it("should use default response template", async () => {
    mockBusinessQuery.single.mockResolvedValue({
      data: {
        facebook_access_token: encryptedToken,
        facebook_page_id: "page-123",
      },
      error: null,
    });

    mockConversationQuery.single.mockResolvedValue({
      data: { facebook_sender_id: facebookSenderId },
      error: null,
    });

    (sendWithRetry as Mock).mockResolvedValue({
      success: true,
      messageId: "mid.12345",
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    // Verify the message insert has the correct Khmer content
    expect(mockMessageInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "សួស្តី! សូមអរគុណសម្រាប់សារ។",
      })
    );
  });

  it("should handle unexpected error in outer catch-all and attempt escalation", async () => {
    // Simulate an unexpected throw from the Supabase client itself
    (createAdminClient as Mock).mockReturnValue({
      from: vi.fn(() => {
        throw new Error("Supabase client crashed");
      }),
    });

    await processAndRespond(tenantId, conversationId, customerMessage);

    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] [RESPOND] Unexpected error:",
      expect.objectContaining({
        tenantId,
        conversationId,
        error: "Supabase client crashed",
      })
    );
  });
});
