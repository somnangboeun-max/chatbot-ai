/**
 * @vitest-environment happy-dom
 * Component tests for CelebrationScreen
 * Story: 2.3 Onboarding Review and Completion
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CelebrationScreen } from "./CelebrationScreen";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock canvas-confetti
const mockConfetti = vi.fn();
vi.mock("canvas-confetti", () => ({
  default: (...args: unknown[]) => mockConfetti(...args),
}));

describe("CelebrationScreen Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders success message in English", () => {
    render(<CelebrationScreen />);
    expect(screen.getByText("Your bot is ready!")).toBeInTheDocument();
  });

  it("renders success message in Khmer", () => {
    render(<CelebrationScreen />);
    expect(
      screen.getByText("បូតរបស់អ្នកត្រៀមខ្លួនរួចរាល់ហើយ!")
    ).toBeInTheDocument();
  });

  it("renders secondary explanation text", () => {
    render(<CelebrationScreen />);
    expect(
      screen.getByText(
        "Your chatbot will now respond to customer messages automatically."
      )
    ).toBeInTheDocument();
  });

  it("renders Go to Dashboard button", () => {
    render(<CelebrationScreen />);
    const dashboardButton = screen.getByRole("button", {
      name: /go to dashboard/i,
    });
    expect(dashboardButton).toBeInTheDocument();
  });

  it("navigates to dashboard when button is clicked", () => {
    render(<CelebrationScreen />);

    const dashboardButton = screen.getByRole("button", {
      name: /go to dashboard/i,
    });
    fireEvent.click(dashboardButton);

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("triggers confetti animation on mount", () => {
    render(<CelebrationScreen />);

    // Confetti should be called immediately on mount
    expect(mockConfetti).toHaveBeenCalled();
  });

  it("fires confetti from both sides of screen", () => {
    render(<CelebrationScreen />);

    // Check that confetti was called with both left (x: 0) and right (x: 1) origins
    const leftConfettiCall = mockConfetti.mock.calls.find(
      (call) => call[0]?.origin?.x === 0
    );
    const rightConfettiCall = mockConfetti.mock.calls.find(
      (call) => call[0]?.origin?.x === 1
    );

    expect(leftConfettiCall).toBeTruthy();
    expect(rightConfettiCall).toBeTruthy();
  });

  it("renders success icon", () => {
    render(<CelebrationScreen />);

    // Check for SVG checkmark icon
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("text-green-600");
  });

  it("has minimum 44px touch target on dashboard button", () => {
    render(<CelebrationScreen />);

    const dashboardButton = screen.getByRole("button", {
      name: /go to dashboard/i,
    });
    expect(dashboardButton).toHaveClass("min-h-[48px]");
  });

  it("stops animation when component unmounts", () => {
    const { unmount } = render(<CelebrationScreen />);

    // Clear mock to count only post-unmount calls
    mockConfetti.mockClear();

    // Unmount the component
    unmount();

    // Advance timers - confetti should NOT be called after unmount
    vi.advanceTimersByTime(1000);

    // No new confetti calls should happen after unmount
    expect(mockConfetti).not.toHaveBeenCalled();
  });
});
