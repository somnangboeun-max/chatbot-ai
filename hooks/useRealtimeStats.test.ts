/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRealtimeStats } from "./useRealtimeStats";
import type { DashboardStats } from "@/types/dashboard";

// Mock Supabase client
const mockOn = vi.fn();
const mockSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

const baseStats: DashboardStats = {
  messagesHandledToday: 10,
  messagesHandledThisWeek: 50,
  overnightMessages: 3,
  ordersCaptured: 2,
  attentionNeeded: 1,
  hasOvernightMessages: true,
};

describe("useRealtimeStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOn.mockReturnValue(mockChannel);
    mockSubscribe.mockReturnValue(mockChannel);
  });

  it("returns initial stats", () => {
    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    expect(result.current).toEqual(baseStats);
  });

  it("subscribes to messages channel with tenant filter", () => {
    renderHook(() => useRealtimeStats("tenant-abc", baseStats));

    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "tenant_id=eq.tenant-abc",
      }),
      expect.any(Function),
    );
  });

  it("subscribes to conversations channel for attention updates", () => {
    renderHook(() => useRealtimeStats("tenant-abc", baseStats));

    expect(mockOn).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: "tenant_id=eq.tenant-abc",
      }),
      expect.any(Function),
    );
  });

  it("increments today and week stats on bot message INSERT", () => {
    let messageCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "messages") {
        messageCallback = callback;
      }
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    const daytime = new Date();
    daytime.setHours(14, 0, 0, 0);

    act(() => {
      messageCallback({
        new: { sender_type: "bot", created_at: daytime.toISOString() },
      });
    });

    expect(result.current.messagesHandledToday).toBe(11);
    expect(result.current.messagesHandledThisWeek).toBe(51);
  });

  it("does not increment stats for customer messages", () => {
    let messageCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "messages") {
        messageCallback = callback;
      }
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    const daytime = new Date();
    daytime.setHours(14, 0, 0, 0);

    act(() => {
      messageCallback({
        new: { sender_type: "customer", created_at: daytime.toISOString() },
      });
    });

    expect(result.current.messagesHandledToday).toBe(10);
  });

  it("increments overnight stats for messages in overnight window", () => {
    let messageCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "messages") {
        messageCallback = callback;
      }
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    // Create a timestamp at 23:00 local time (within overnight window 22:00-08:00)
    const overnightTime = new Date();
    overnightTime.setHours(23, 0, 0, 0);

    act(() => {
      messageCallback({
        new: { sender_type: "bot", created_at: overnightTime.toISOString() },
      });
    });

    expect(result.current.overnightMessages).toBe(4);
    expect(result.current.hasOvernightMessages).toBe(true);
  });

  it("does not increment overnight stats for daytime messages", () => {
    let messageCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "messages") {
        messageCallback = callback;
      }
      return mockChannel;
    });

    const statsNoOvernight: DashboardStats = {
      ...baseStats,
      overnightMessages: 0,
      hasOvernightMessages: false,
    };

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", statsNoOvernight),
    );

    // Create a timestamp at 14:00 local time (NOT in overnight window)
    const daytimeTime = new Date();
    daytimeTime.setHours(14, 0, 0, 0);

    act(() => {
      messageCallback({
        new: { sender_type: "bot", created_at: daytimeTime.toISOString() },
      });
    });

    expect(result.current.overnightMessages).toBe(0);
    expect(result.current.hasOvernightMessages).toBe(false);
  });

  it("increments attentionNeeded when conversation status changes to needs_attention", () => {
    let conversationCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "conversations") {
        conversationCallback = callback;
      }
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    act(() => {
      conversationCallback({
        old: { status: "active" },
        new: { status: "needs_attention" },
      });
    });

    expect(result.current.attentionNeeded).toBe(2);
  });

  it("decrements attentionNeeded when conversation status changes from needs_attention", () => {
    let conversationCallback: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _config, callback) => {
      if (_config.table === "conversations") {
        conversationCallback = callback;
      }
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    act(() => {
      conversationCallback({
        old: { status: "needs_attention" },
        new: { status: "owner_handled" },
      });
    });

    expect(result.current.attentionNeeded).toBe(0);
  });

  it("cleans up channels on unmount", () => {
    const { unmount } = renderHook(() =>
      useRealtimeStats("tenant-1", baseStats),
    );

    unmount();

    // Should remove both channels
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });
});
