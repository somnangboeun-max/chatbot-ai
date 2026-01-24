/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandoverReasonBadge } from "./HandoverReasonBadge";
import type { HandoverReason } from "@/types/dashboard";

describe("HandoverReasonBadge", () => {
  it('renders "Low confidence" for low_confidence reason', () => {
    render(<HandoverReasonBadge reason="low_confidence" />);
    expect(screen.getByText("Low confidence")).toBeInTheDocument();
  });

  it('renders "Frustrated" for customer_frustrated reason', () => {
    render(<HandoverReasonBadge reason="customer_frustrated" />);
    expect(screen.getByText("Frustrated")).toBeInTheDocument();
  });

  it('renders "Human requested" for human_requested reason', () => {
    render(<HandoverReasonBadge reason="human_requested" />);
    expect(screen.getByText("Human requested")).toBeInTheDocument();
  });

  it('renders "Complex" for complex_question reason', () => {
    render(<HandoverReasonBadge reason="complex_question" />);
    expect(screen.getByText("Complex")).toBeInTheDocument();
  });

  it("applies amber styling for low_confidence", () => {
    const { container } = render(<HandoverReasonBadge reason="low_confidence" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-800");
    expect(badge.className).toContain("border-amber-200");
  });

  it("applies red styling for customer_frustrated", () => {
    const { container } = render(<HandoverReasonBadge reason="customer_frustrated" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
    expect(badge.className).toContain("border-red-200");
  });

  it("applies blue styling for human_requested", () => {
    const { container } = render(<HandoverReasonBadge reason="human_requested" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");
    expect(badge.className).toContain("border-blue-200");
  });

  it("applies purple styling for complex_question", () => {
    const { container } = render(<HandoverReasonBadge reason="complex_question" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-purple-100");
    expect(badge.className).toContain("text-purple-800");
    expect(badge.className).toContain("border-purple-200");
  });
});
