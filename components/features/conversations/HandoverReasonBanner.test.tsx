/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandoverReasonBanner } from "./HandoverReasonBanner";
import type { HandoverReason } from "@/types";

describe("HandoverReasonBanner", () => {
  it('renders correct message for low_confidence reason', () => {
    render(<HandoverReasonBanner reason="low_confidence" />);

    expect(screen.getByText("Needs attention:")).toBeInTheDocument();
    expect(screen.getByText("Bot wasn't sure how to answer")).toBeInTheDocument();
  });

  it('renders correct message for customer_frustrated reason', () => {
    render(<HandoverReasonBanner reason="customer_frustrated" />);

    expect(screen.getByText("Needs attention:")).toBeInTheDocument();
    expect(screen.getByText("Customer seemed frustrated")).toBeInTheDocument();
  });

  it('renders correct message for human_requested reason', () => {
    render(<HandoverReasonBanner reason="human_requested" />);

    expect(screen.getByText("Needs attention:")).toBeInTheDocument();
    expect(screen.getByText("Customer asked for a human")).toBeInTheDocument();
  });

  it('renders correct message for complex_question reason', () => {
    render(<HandoverReasonBanner reason="complex_question" />);

    expect(screen.getByText("Needs attention:")).toBeInTheDocument();
    expect(screen.getByText("Complex question detected")).toBeInTheDocument();
  });

  it("uses amber/warning styling", () => {
    const { container } = render(<HandoverReasonBanner reason="low_confidence" />);

    const banner = screen.getByTestId("handover-reason-banner");
    expect(banner.className).toContain("bg-amber-50");
    expect(banner.className).toContain("border-amber-200");
  });

  it("includes warning icon", () => {
    const { container } = render(<HandoverReasonBanner reason="low_confidence" />);

    // Lucide icons render as SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.className).toContain("text-amber-600");
  });

  it("includes data-reason attribute for testing", () => {
    render(<HandoverReasonBanner reason="human_requested" />);

    const banner = screen.getByTestId("handover-reason-banner");
    expect(banner).toHaveAttribute("data-reason", "human_requested");
  });

  it("renders all reason types correctly", () => {
    const reasons: HandoverReason[] = [
      "low_confidence",
      "customer_frustrated",
      "human_requested",
      "complex_question",
    ];

    reasons.forEach((reason) => {
      const { unmount } = render(<HandoverReasonBanner reason={reason} />);
      expect(screen.getByTestId("handover-reason-banner")).toBeInTheDocument();
      unmount();
    });
  });
});
