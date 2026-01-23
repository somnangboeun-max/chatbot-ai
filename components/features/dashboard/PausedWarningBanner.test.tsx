/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PausedWarningBanner } from "./PausedWarningBanner";

describe("PausedWarningBanner", () => {
  const defaultProps = {
    onResume: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders warning message", () => {
    render(<PausedWarningBanner {...defaultProps} />);

    expect(
      screen.getByText(
        "Your bot is paused — messages are not being answered",
      ),
    ).toBeInTheDocument();
  });

  it("renders Resume button", () => {
    render(<PausedWarningBanner {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Resume" }),
    ).toBeInTheDocument();
  });

  it("calls onResume when Resume button is clicked", () => {
    render(<PausedWarningBanner {...defaultProps} />);

    const resumeButton = screen.getByRole("button", { name: "Resume" });
    fireEvent.click(resumeButton);

    expect(defaultProps.onResume).toHaveBeenCalledTimes(1);
  });

  it("disables Resume button when isPending is true", () => {
    render(<PausedWarningBanner {...defaultProps} isPending={true} />);

    const resumeButton = screen.getByRole("button", { name: "Resume" });
    expect(resumeButton).toBeDisabled();
  });

  it("enables Resume button when isPending is false", () => {
    render(<PausedWarningBanner {...defaultProps} isPending={false} />);

    const resumeButton = screen.getByRole("button", { name: "Resume" });
    expect(resumeButton).not.toBeDisabled();
  });

  it("has destructive styling", () => {
    const { container } = render(<PausedWarningBanner {...defaultProps} />);

    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("bg-destructive/10");
    expect(banner).toHaveClass("border-destructive/20");
  });

  it("Resume button has minimum touch target height", () => {
    render(<PausedWarningBanner {...defaultProps} />);

    const resumeButton = screen.getByRole("button", { name: "Resume" });
    expect(resumeButton).toHaveClass("min-h-[44px]");
  });
});
