/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AttentionItemListWrapper } from "./AttentionItemListWrapper";
import type { AttentionItem } from "@/types/dashboard";

vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 minutes ago",
}));

type RealtimeCallback = (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn().mockReturnThis();
let registeredCallbacks: { event: string; callback: RealtimeCallback }[] = [];

const mockChannel = {
  on: vi.fn((_type: string, opts: { event: string }, callback: RealtimeCallback) => {
    registeredCallbacks.push({ event: opts.event, callback });
    return mockChannel;
  }),
  subscribe: mockSubscribe,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  }),
}));

const mockItems: AttentionItem[] = [
  {
    id: "conv-1",
    customerName: "Sokha Chan",
    customerAvatarUrl: null,
    handoverReason: "low_confidence",
    messagePreview: "What is the price?",
    lastMessageAt: "2026-01-24T09:00:00Z",
    viewedAt: null,
  },
  {
    id: "conv-2",
    customerName: "Dara Mao",
    customerAvatarUrl: null,
    handoverReason: "customer_frustrated",
    messagePreview: "Terrible service",
    lastMessageAt: "2026-01-24T08:30:00Z",
    viewedAt: null,
  },
];

describe("AttentionItemListWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registeredCallbacks = [];
    mockChannel.on.mockImplementation((_type: string, opts: { event: string }, callback: RealtimeCallback) => {
      registeredCallbacks.push({ event: opts.event, callback });
      return mockChannel;
    });
  });

  it("renders initial items", () => {
    render(
      <AttentionItemListWrapper initialItems={mockItems} tenantId="tenant-1" />,
    );

    expect(screen.getByText("Sokha Chan")).toBeInTheDocument();
    expect(screen.getByText("Dara Mao")).toBeInTheDocument();
  });

  it("renders empty state when no initial items", () => {
    render(
      <AttentionItemListWrapper initialItems={[]} tenantId="tenant-1" />,
    );

    expect(screen.getByText("All caught up!")).toBeInTheDocument();
  });

  it("sets up realtime subscription on mount", () => {
    render(
      <AttentionItemListWrapper initialItems={[]} tenantId="tenant-1" />,
    );

    expect(mockSubscribe).toHaveBeenCalled();
    // Should register both INSERT and UPDATE handlers
    const events = registeredCallbacks.map((c) => c.event);
    expect(events).toContain("INSERT");
    expect(events).toContain("UPDATE");
  });

  it("cleans up subscription on unmount", () => {
    const { unmount } = render(
      <AttentionItemListWrapper initialItems={[]} tenantId="tenant-1" />,
    );

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it("does not subscribe when tenantId is empty", () => {
    render(
      <AttentionItemListWrapper initialItems={[]} tenantId="" />,
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("adds item on INSERT with needs_attention status", () => {
    render(
      <AttentionItemListWrapper initialItems={mockItems} tenantId="tenant-1" />,
    );

    const insertCallback = registeredCallbacks.find((c) => c.event === "INSERT");
    expect(insertCallback).toBeDefined();

    act(() => {
      insertCallback!.callback({
        old: {},
        new: {
          id: "conv-new",
          status: "needs_attention",
          customer_name: "New Customer",
          customer_avatar_url: null,
          handover_reason: "human_requested",
          last_message_preview: "I need help",
          last_message_at: "2026-01-24T10:00:00Z",
          viewed_at: null,
        },
      });
    });

    expect(screen.getByText("New Customer")).toBeInTheDocument();
  });

  it("ignores INSERT with non-attention status", () => {
    render(
      <AttentionItemListWrapper initialItems={mockItems} tenantId="tenant-1" />,
    );

    const insertCallback = registeredCallbacks.find((c) => c.event === "INSERT");

    act(() => {
      insertCallback!.callback({
        old: {},
        new: {
          id: "conv-active",
          status: "active",
          customer_name: "Active Customer",
          customer_avatar_url: null,
          handover_reason: null,
          last_message_preview: "Hello",
          last_message_at: "2026-01-24T10:00:00Z",
          viewed_at: null,
        },
      });
    });

    expect(screen.queryByText("Active Customer")).not.toBeInTheDocument();
  });

  it("adds item on UPDATE when status changes to needs_attention", () => {
    render(
      <AttentionItemListWrapper initialItems={mockItems} tenantId="tenant-1" />,
    );

    const updateCallback = registeredCallbacks.find((c) => c.event === "UPDATE");

    act(() => {
      updateCallback!.callback({
        old: { id: "conv-escalated", status: "active" },
        new: {
          id: "conv-escalated",
          status: "needs_attention",
          customer_name: "Escalated Customer",
          customer_avatar_url: null,
          handover_reason: "complex_question",
          last_message_preview: "Complex question here",
          last_message_at: "2026-01-24T10:30:00Z",
          viewed_at: null,
        },
      });
    });

    expect(screen.getByText("Escalated Customer")).toBeInTheDocument();
  });

  it("removes item on UPDATE when status changes from needs_attention", () => {
    render(
      <AttentionItemListWrapper initialItems={mockItems} tenantId="tenant-1" />,
    );

    expect(screen.getByText("Sokha Chan")).toBeInTheDocument();

    const updateCallback = registeredCallbacks.find((c) => c.event === "UPDATE");

    act(() => {
      updateCallback!.callback({
        old: { id: "conv-1", status: "needs_attention" },
        new: {
          id: "conv-1",
          status: "owner_handled",
          customer_name: "Sokha Chan",
          customer_avatar_url: null,
          handover_reason: "low_confidence",
          last_message_preview: "What is the price?",
          last_message_at: "2026-01-24T09:00:00Z",
          viewed_at: null,
        },
      });
    });

    expect(screen.queryByText("Sokha Chan")).not.toBeInTheDocument();
  });

  it("limits displayed items to 10", () => {
    const tenItems: AttentionItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `conv-${i}`,
      customerName: `Customer ${i}`,
      customerAvatarUrl: null,
      handoverReason: "low_confidence" as const,
      messagePreview: `Message ${i}`,
      lastMessageAt: "2026-01-24T09:00:00Z",
      viewedAt: null,
    }));

    render(
      <AttentionItemListWrapper initialItems={tenItems} tenantId="tenant-1" />,
    );

    const insertCallback = registeredCallbacks.find((c) => c.event === "INSERT");

    act(() => {
      insertCallback!.callback({
        old: {},
        new: {
          id: "conv-overflow",
          status: "needs_attention",
          customer_name: "Overflow Customer",
          customer_avatar_url: null,
          handover_reason: "human_requested",
          last_message_preview: "Overflow",
          last_message_at: "2026-01-24T10:00:00Z",
          viewed_at: null,
        },
      });
    });

    // New item should be added at the top
    expect(screen.getByText("Overflow Customer")).toBeInTheDocument();
    // Last item (Customer 9) should be pushed out
    expect(screen.queryByText("Customer 9")).not.toBeInTheDocument();
  });
});
