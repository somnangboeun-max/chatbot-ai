/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HeroSummaryCardWrapper } from "./HeroSummaryCardWrapper";
import type { DashboardStats } from "@/types/dashboard";

// Mock the useRealtimeStats hook
vi.mock("@/hooks/useRealtimeStats", () => ({
  useRealtimeStats: vi.fn(),
}));

import { useRealtimeStats } from "@/hooks/useRealtimeStats";

const mockUseRealtimeStats = vi.mocked(useRealtimeStats);

const baseStats: DashboardStats = {
  messagesHandledToday: 10,
  messagesHandledThisWeek: 50,
  overnightMessages: 0,
  ordersCaptured: 2,
  attentionNeeded: 1,
  hasOvernightMessages: false,
};

describe("HeroSummaryCardWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial stats", () => {
    mockUseRealtimeStats.mockReturnValue(baseStats);

    render(
      <HeroSummaryCardWrapper initialStats={baseStats} tenantId="tenant-1" />,
    );

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("messages handled today")).toBeInTheDocument();
  });

  it("passes tenantId and initialStats to useRealtimeStats hook", () => {
    mockUseRealtimeStats.mockReturnValue(baseStats);

    render(
      <HeroSummaryCardWrapper initialStats={baseStats} tenantId="tenant-123" />,
    );

    expect(mockUseRealtimeStats).toHaveBeenCalledWith("tenant-123", baseStats);
  });

  it("renders updated stats when real-time updates occur", () => {
    const updatedStats: DashboardStats = {
      ...baseStats,
      messagesHandledToday: 15,
    };
    mockUseRealtimeStats.mockReturnValue(updatedStats);

    render(
      <HeroSummaryCardWrapper initialStats={baseStats} tenantId="tenant-1" />,
    );

    // Should show the updated value from the hook, not the initial prop
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders overnight framing when hook returns overnight data", () => {
    const overnightStats: DashboardStats = {
      ...baseStats,
      overnightMessages: 7,
      hasOvernightMessages: true,
    };
    mockUseRealtimeStats.mockReturnValue(overnightStats);

    render(
      <HeroSummaryCardWrapper
        initialStats={baseStats}
        tenantId="tenant-1"
      />,
    );

    expect(screen.getByText("While you slept...")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders empty state when stats are all zeros", () => {
    const emptyStats: DashboardStats = {
      messagesHandledToday: 0,
      messagesHandledThisWeek: 0,
      overnightMessages: 0,
      ordersCaptured: 0,
      attentionNeeded: 0,
      hasOvernightMessages: false,
    };
    mockUseRealtimeStats.mockReturnValue(emptyStats);

    render(
      <HeroSummaryCardWrapper initialStats={emptyStats} tenantId="tenant-1" />,
    );

    expect(
      screen.getByText("Ready to help your customers!"),
    ).toBeInTheDocument();
  });
});
