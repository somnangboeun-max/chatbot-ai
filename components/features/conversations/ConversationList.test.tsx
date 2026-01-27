/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationList } from "./ConversationList";
import type { ConversationListItem } from "@/types/conversations";

// Mock date-fns formatDistanceToNow
vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "5 minutes ago"),
}));

const mockConversations: ConversationListItem[] = [
  {
    id: "conv-1",
    customerName: "John Doe",
    customerAvatarUrl: null,
    status: "bot_handled",
    lastMessagePreview: "Hello there",
    lastMessageAt: "2026-01-26T10:00:00Z",
    viewedAt: "2026-01-26T10:05:00Z",
  },
  {
    id: "conv-2",
    customerName: "Jane Smith",
    customerAvatarUrl: null,
    status: "needs_attention",
    lastMessagePreview: "I need help",
    lastMessageAt: "2026-01-26T09:00:00Z",
    viewedAt: null,
  },
];

describe("ConversationList", () => {
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders list of ConversationListItem components", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={false}
      />
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows empty state when no conversations", () => {
    render(
      <ConversationList
        conversations={[]}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={false}
      />
    );
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
    expect(screen.getByText("Messages from your customers will appear here")).toBeInTheDocument();
  });

  it('shows "Load more" button when hasMore is true', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={false}
      />
    );
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });

  it('hides "Load more" button when hasMore is false', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={false}
      />
    );
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("shows loading state in button when isLoadingMore is true", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={true}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("disables button when isLoadingMore is true", () => {
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={true}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("calls onLoadMore when Load more button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConversationList
        conversations={mockConversations}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        isLoadingMore={false}
      />
    );
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });
});
