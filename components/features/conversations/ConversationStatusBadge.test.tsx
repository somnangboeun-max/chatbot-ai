/** @vitest-environment happy-dom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

describe("ConversationStatusBadge", () => {
  it('renders "Bot handled" for bot_handled status', () => {
    render(<ConversationStatusBadge status="bot_handled" />);
    expect(screen.getByText("Bot handled")).toBeInTheDocument();
  });

  it('renders "Needs attention" for needs_attention status', () => {
    render(<ConversationStatusBadge status="needs_attention" />);
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
  });

  it('renders "You replied" for owner_handled status', () => {
    render(<ConversationStatusBadge status="owner_handled" />);
    expect(screen.getByText("You replied")).toBeInTheDocument();
  });

  it('renders "Active" for active status', () => {
    render(<ConversationStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies green styling for bot_handled", () => {
    const { container } = render(<ConversationStatusBadge status="bot_handled" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
    expect(badge.className).toContain("border-green-200");
  });

  it("applies amber styling for needs_attention", () => {
    const { container } = render(<ConversationStatusBadge status="needs_attention" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-800");
    expect(badge.className).toContain("border-amber-200");
  });

  it("applies blue styling for owner_handled", () => {
    const { container } = render(<ConversationStatusBadge status="owner_handled" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");
    expect(badge.className).toContain("border-blue-200");
  });

  it("applies gray styling for active", () => {
    const { container } = render(<ConversationStatusBadge status="active" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-800");
    expect(badge.className).toContain("border-gray-200");
  });
});
