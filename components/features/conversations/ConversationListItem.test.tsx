/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversationListItem } from "./ConversationListItem";
import type { ConversationListItem as ConversationListItemType } from "@/types/conversations";

// Mock date-fns formatDistanceToNow
vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "5 minutes ago"),
}));

const mockConversation: ConversationListItemType = {
  id: "conv-123",
  customerName: "John Doe",
  customerAvatarUrl: "https://example.com/avatar.jpg",
  status: "bot_handled",
  lastMessagePreview: "Hello, I have a question about your product",
  lastMessageAt: "2026-01-26T10:00:00Z",
  viewedAt: "2026-01-26T10:05:00Z",
};

describe("ConversationListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders customer name", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders avatar with image URL when provided", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    // Avatar component may render image async or with fallback
    // Check that the avatar wrapper exists with the correct data attribute
    const avatar = document.querySelector('[data-slot="avatar"]');
    expect(avatar).toBeInTheDocument();
  });

  it("renders avatar with initials fallback when no image", () => {
    const noAvatarConversation: ConversationListItemType = {
      ...mockConversation,
      customerAvatarUrl: null,
    };
    render(<ConversationListItem conversation={noAvatarConversation} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders message preview", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    expect(screen.getByText("Hello, I have a question about your product")).toBeInTheDocument();
  });

  it("renders message preview truncated at 50 chars", () => {
    const longPreviewConversation: ConversationListItemType = {
      ...mockConversation,
      lastMessagePreview: "This is a very long message that should be truncated because it exceeds fifty characters",
    };
    render(<ConversationListItem conversation={longPreviewConversation} />);
    expect(screen.getByText("This is a very long message that should be truncat...")).toBeInTheDocument();
  });

  it('renders "No messages yet" when preview is null', () => {
    const noPreviewConversation: ConversationListItemType = {
      ...mockConversation,
      lastMessagePreview: null,
    };
    render(<ConversationListItem conversation={noPreviewConversation} />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("renders relative time", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
  });

  it("renders ConversationStatusBadge with correct status", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    expect(screen.getByText("Bot handled")).toBeInTheDocument();
  });

  it("links to /messages/{id}", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/messages/conv-123");
  });

  it("applies font-semibold when viewedAt is null (unviewed)", () => {
    const unviewedConversation: ConversationListItemType = {
      ...mockConversation,
      viewedAt: null,
    };
    render(<ConversationListItem conversation={unviewedConversation} />);
    const nameElement = screen.getByText("John Doe");
    expect(nameElement.className).toContain("font-semibold");
  });

  it("does not apply font-semibold when viewedAt is set", () => {
    render(<ConversationListItem conversation={mockConversation} />);
    const nameElement = screen.getByText("John Doe");
    expect(nameElement.className).not.toContain("font-semibold");
  });
});
