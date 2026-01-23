/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BotStatusToggle } from "./BotStatusToggle";

describe("BotStatusToggle", () => {
  const defaultProps = {
    botActive: true,
    isPending: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Bot Active' with green indicator when active", () => {
    render(<BotStatusToggle {...defaultProps} botActive={true} />);

    expect(screen.getByText("Bot Active")).toBeInTheDocument();
    expect(
      screen.getByText("Responding to customer messages"),
    ).toBeInTheDocument();

    const dot = document.querySelector("span.inline-block");
    expect(dot).toHaveClass("bg-success");
  });

  it("renders 'Bot Paused' with red indicator when paused", () => {
    render(<BotStatusToggle {...defaultProps} botActive={false} />);

    expect(screen.getByText("Bot Paused")).toBeInTheDocument();
    expect(
      screen.getByText("Messages will go unanswered"),
    ).toBeInTheDocument();

    const dot = document.querySelector("span.inline-block");
    expect(dot).toHaveClass("bg-error");
  });

  it("shows confirmation dialog when toggling to pause", () => {
    render(<BotStatusToggle {...defaultProps} botActive={true} />);

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    expect(screen.getByText("Pause bot?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Messages will go unanswered while the bot is paused. You can resume at any time.",
      ),
    ).toBeInTheDocument();
  });

  it("calls onToggle(true) immediately without confirmation when resuming", () => {
    render(<BotStatusToggle {...defaultProps} botActive={false} />);

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
    // Dialog should NOT appear for resume
    expect(screen.queryByText("Pause bot?")).not.toBeInTheDocument();
  });

  it("calls onToggle(false) when confirming pause in dialog", () => {
    render(<BotStatusToggle {...defaultProps} botActive={true} />);

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    const pauseButton = screen.getByRole("button", { name: "Pause Bot" });
    fireEvent.click(pauseButton);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
  });

  it("closes dialog without toggling when Cancel is clicked", () => {
    render(<BotStatusToggle {...defaultProps} botActive={true} />);

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(defaultProps.onToggle).not.toHaveBeenCalled();
  });

  it("disables switch during pending state", () => {
    render(<BotStatusToggle {...defaultProps} isPending={true} />);

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeDisabled();
  });

  it("has correct aria-label for active state", () => {
    render(<BotStatusToggle {...defaultProps} botActive={true} />);

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-label", "Pause bot");
  });

  it("has correct aria-label for paused state", () => {
    render(<BotStatusToggle {...defaultProps} botActive={false} />);

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-label", "Resume bot");
  });
});
