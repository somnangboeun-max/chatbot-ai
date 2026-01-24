/** @vitest-environment happy-dom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionItemList } from "./AttentionItemList";
import type { AttentionItem } from "@/types/dashboard";

vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "3 minutes ago",
}));

const mockItems: AttentionItem[] = [
  {
    id: "conv-1",
    customerName: "Bopha Keo",
    customerAvatarUrl: null,
    handoverReason: "low_confidence",
    messagePreview: "What is the price?",
    lastMessageAt: "2026-01-24T09:00:00Z",
    viewedAt: null,
  },
  {
    id: "conv-2",
    customerName: "Dara Mao",
    customerAvatarUrl: null,
    handoverReason: "customer_frustrated",
    messagePreview: "This is terrible service",
    lastMessageAt: "2026-01-24T08:30:00Z",
    viewedAt: null,
  },
  {
    id: "conv-3",
    customerName: "Vanna Pich",
    customerAvatarUrl: null,
    handoverReason: "human_requested",
    messagePreview: "I want to speak to a person",
    lastMessageAt: "2026-01-24T08:00:00Z",
    viewedAt: "2026-01-24T08:15:00Z",
  },
];

describe("AttentionItemList", () => {
  it("renders list of AttentionItemCard components", () => {
    render(<AttentionItemList items={mockItems} />);

    expect(screen.getByText("Bopha Keo")).toBeInTheDocument();
    expect(screen.getByText("Dara Mao")).toBeInTheDocument();
    expect(screen.getByText("Vanna Pich")).toBeInTheDocument();
  });

  it('shows "All caught up!" empty state when items is empty array', () => {
    render(<AttentionItemList items={[]} />);
    expect(screen.getByText("All caught up!")).toBeInTheDocument();
  });

  it("does not show empty state when items exist", () => {
    render(<AttentionItemList items={mockItems} />);
    expect(screen.queryByText("All caught up!")).not.toBeInTheDocument();
  });

  it("shows count in section header", () => {
    render(<AttentionItemList items={mockItems} />);
    expect(screen.getByText("Attention Needed (3)")).toBeInTheDocument();
  });

  it("renders correct number of items", () => {
    const { container } = render(<AttentionItemList items={mockItems} />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(3);
  });

  it("renders links to correct conversation paths", () => {
    const { container } = render(<AttentionItemList items={mockItems} />);
    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveAttribute("href", "/messages/conv-1");
    expect(links[1]).toHaveAttribute("href", "/messages/conv-2");
    expect(links[2]).toHaveAttribute("href", "/messages/conv-3");
  });
});
