/** @vitest-environment happy-dom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionItemCard } from "./AttentionItemCard";
import type { AttentionItem } from "@/types/dashboard";

vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "5 minutes ago",
}));

const baseItem: AttentionItem = {
  id: "conv-123",
  customerName: "Sokha Chan",
  customerAvatarUrl: "https://example.com/avatar.jpg",
  handoverReason: "low_confidence",
  messagePreview: "Can I order two bags of rice?",
  lastMessageAt: "2026-01-24T10:00:00Z",
  viewedAt: null,
};

describe("AttentionItemCard", () => {
  it("renders customer name", () => {
    render(<AttentionItemCard item={baseItem} />);
    expect(screen.getByText("Sokha Chan")).toBeInTheDocument();
  });

  it("renders avatar container when image URL is provided", () => {
    const { container } = render(<AttentionItemCard item={baseItem} />);
    const avatar = container.querySelector("[data-slot='avatar']");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("h-10", "w-10");
  });

  it("renders avatar with initials fallback when no image", () => {
    const item: AttentionItem = { ...baseItem, customerAvatarUrl: null };
    render(<AttentionItemCard item={item} />);
    expect(screen.getByText("SC")).toBeInTheDocument();
  });

  it("renders message preview when provided", () => {
    render(<AttentionItemCard item={baseItem} />);
    expect(screen.getByText("Can I order two bags of rice?")).toBeInTheDocument();
  });

  it("renders message preview truncated at 60 chars", () => {
    const longMessage = "This is a very long message that exceeds the sixty character limit and should be truncated";
    const item: AttentionItem = { ...baseItem, messagePreview: longMessage };
    render(<AttentionItemCard item={item} />);
    const expected = longMessage.slice(0, 60) + "...";
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders full preview when less than 60 chars", () => {
    const shortMessage = "Short message";
    const item: AttentionItem = { ...baseItem, messagePreview: shortMessage };
    render(<AttentionItemCard item={item} />);
    expect(screen.getByText("Short message")).toBeInTheDocument();
  });

  it('renders "No message preview" when preview is null', () => {
    const item: AttentionItem = { ...baseItem, messagePreview: null };
    render(<AttentionItemCard item={item} />);
    expect(screen.getByText("No message preview")).toBeInTheDocument();
  });

  it("renders relative time", () => {
    render(<AttentionItemCard item={baseItem} />);
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
  });

  it("renders HandoverReasonBadge when reason is present", () => {
    render(<AttentionItemCard item={baseItem} />);
    expect(screen.getByText("Low confidence")).toBeInTheDocument();
  });

  it("does not render badge when reason is null", () => {
    const item: AttentionItem = { ...baseItem, handoverReason: null };
    render(<AttentionItemCard item={item} />);
    expect(screen.queryByText("Low confidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Frustrated")).not.toBeInTheDocument();
    expect(screen.queryByText("Human requested")).not.toBeInTheDocument();
    expect(screen.queryByText("Complex")).not.toBeInTheDocument();
  });

  it("links to /messages/{id}", () => {
    const { container } = render(<AttentionItemCard item={baseItem} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/messages/conv-123");
  });

  it("applies font-semibold when viewedAt is null (unviewed)", () => {
    render(<AttentionItemCard item={baseItem} />);
    const name = screen.getByText("Sokha Chan");
    expect(name.className).toContain("font-semibold");
  });

  it("does not apply font-semibold when viewedAt is set", () => {
    const item: AttentionItem = { ...baseItem, viewedAt: "2026-01-24T10:30:00Z" };
    render(<AttentionItemCard item={item} />);
    const name = screen.getByText("Sokha Chan");
    expect(name.className).not.toContain("font-semibold");
  });
});
