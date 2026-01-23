/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BotStatusToggleWrapper } from "./BotStatusToggleWrapper";

// Mock the useBotStatus hook
vi.mock("@/hooks/useBotStatus", () => ({
  useBotStatus: vi.fn(),
}));

// Mock the toggleBotStatus action
vi.mock("@/actions/bot", () => ({
  toggleBotStatus: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useBotStatus } from "@/hooks/useBotStatus";
import { toggleBotStatus } from "@/actions/bot";
import { toast } from "sonner";

const mockUseBotStatus = vi.mocked(useBotStatus);
const mockToggleBotStatus = vi.mocked(toggleBotStatus);

describe("BotStatusToggleWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBotStatus.mockReturnValue(true);
    mockToggleBotStatus.mockResolvedValue({
      success: true,
      data: { botActive: true, pausedAt: null },
    });
  });

  it("renders BotStatusToggle with active state", () => {
    mockUseBotStatus.mockReturnValue(true);

    render(
      <BotStatusToggleWrapper initialBotActive={true} tenantId="tenant-1" />,
    );

    expect(screen.getByText("Bot Active")).toBeInTheDocument();
  });

  it("renders PausedWarningBanner when bot is paused", () => {
    mockUseBotStatus.mockReturnValue(false);

    render(
      <BotStatusToggleWrapper initialBotActive={false} tenantId="tenant-1" />,
    );

    expect(
      screen.getByText(
        "Your bot is paused — messages are not being answered",
      ),
    ).toBeInTheDocument();
  });

  it("does not render PausedWarningBanner when bot is active", () => {
    mockUseBotStatus.mockReturnValue(true);

    render(
      <BotStatusToggleWrapper initialBotActive={true} tenantId="tenant-1" />,
    );

    expect(
      screen.queryByText(
        "Your bot is paused — messages are not being answered",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows success toast on successful resume", async () => {
    mockUseBotStatus.mockReturnValue(false);
    mockToggleBotStatus.mockResolvedValue({
      success: true,
      data: { botActive: true, pausedAt: null },
    });

    render(
      <BotStatusToggleWrapper initialBotActive={false} tenantId="tenant-1" />,
    );

    // Resume via the switch (clicking when paused resumes immediately)
    const switchEl = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(switchEl);
    });

    await waitFor(() => {
      expect(mockToggleBotStatus).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Bot resumed");
    });
  });

  it("shows success toast on successful pause", async () => {
    mockUseBotStatus.mockReturnValue(true);
    mockToggleBotStatus.mockResolvedValue({
      success: true,
      data: { botActive: false, pausedAt: "2026-01-23T00:00:00Z" },
    });

    render(
      <BotStatusToggleWrapper initialBotActive={true} tenantId="tenant-1" />,
    );

    // Click switch to open pause dialog
    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    // Confirm pause
    const pauseButton = screen.getByRole("button", { name: "Pause Bot" });
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    await waitFor(() => {
      expect(mockToggleBotStatus).toHaveBeenCalledWith(false);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Bot paused");
    });
  });

  it("shows error toast and reverts on failed toggle", async () => {
    mockUseBotStatus.mockReturnValue(false);
    mockToggleBotStatus.mockResolvedValue({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update bot status" },
    });

    render(
      <BotStatusToggleWrapper initialBotActive={false} tenantId="tenant-1" />,
    );

    // Try to resume
    const switchEl = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(switchEl);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update bot status");
    });

    // Should revert to paused state
    await waitFor(() => {
      expect(screen.getByText("Bot Paused")).toBeInTheDocument();
    });
  });

  it("passes tenantId and initialBotActive to useBotStatus hook", () => {
    mockUseBotStatus.mockReturnValue(true);

    render(
      <BotStatusToggleWrapper
        initialBotActive={true}
        tenantId="tenant-123"
      />,
    );

    expect(mockUseBotStatus).toHaveBeenCalledWith("tenant-123", true);
  });

  it("banner Resume button triggers toggle action", async () => {
    mockUseBotStatus.mockReturnValue(false);
    mockToggleBotStatus.mockResolvedValue({
      success: true,
      data: { botActive: true, pausedAt: null },
    });

    render(
      <BotStatusToggleWrapper initialBotActive={false} tenantId="tenant-1" />,
    );

    const resumeButton = screen.getByRole("button", { name: "Resume" });
    await act(async () => {
      fireEvent.click(resumeButton);
    });

    await waitFor(() => {
      expect(mockToggleBotStatus).toHaveBeenCalledWith(true);
    });
  });
});
