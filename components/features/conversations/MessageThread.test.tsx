/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageThread } from "./MessageThread";
import type { Message } from "@/types/messages";

// Mock date-fns functions for consistent testing
vi.mock("date-fns", () => ({
  format: vi.fn(() => "10:30 AM"),
  isToday: vi.fn(() => true),
  isYesterday: vi.fn(() => false),
}));

describe("MessageThread", () => {
  const mockMessages: Message[] = [
    {
      id: "msg-3",
      conversationId: "conv-1",
      senderType: "customer",
      content: "Latest message",
      createdAt: "2026-01-15T10:32:00Z",
      isHandoverTrigger: false,
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderType: "bot",
      content: "Bot response",
      createdAt: "2026-01-15T10:31:00Z",
      isHandoverTrigger: false,
    },
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderType: "customer",
      content: "First message",
      createdAt: "2026-01-15T10:30:00Z",
      isHandoverTrigger: false,
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    customerName: "John Doe",
    customerAvatarUrl: null,
    hasMore: false,
    onLoadMore: vi.fn(),
    isLoadingMore: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders messages in chronological order (oldest first at top)", () => {
    render(<MessageThread {...defaultProps} />);

    const thread = screen.getByTestId("message-thread");
    const bubbles = thread.querySelectorAll('[data-testid="message-bubble"]');

    // Messages should be reversed for display (oldest first)
    expect(bubbles).toHaveLength(3);
    expect(bubbles[0]).toHaveTextContent("First message");
    expect(bubbles[1]).toHaveTextContent("Bot response");
    expect(bubbles[2]).toHaveTextContent("Latest message");
  });

  it('shows "Load older messages" button when hasMore is true', () => {
    render(<MessageThread {...defaultProps} hasMore={true} />);

    expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    expect(screen.getByText("Load older messages")).toBeInTheDocument();
  });

  it('hides "Load older messages" button when hasMore is false', () => {
    render(<MessageThread {...defaultProps} hasMore={false} />);

    expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
  });

  it("calls onLoadMore when load button is clicked", () => {
    const onLoadMore = vi.fn();
    render(<MessageThread {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByTestId("load-more-button"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when isLoadingMore is true", () => {
    render(<MessageThread {...defaultProps} hasMore={true} isLoadingMore={true} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByTestId("load-more-button")).toBeDisabled();
  });

  it("disables button while loading more", () => {
    render(<MessageThread {...defaultProps} hasMore={true} isLoadingMore={true} />);

    const button = screen.getByTestId("load-more-button");
    expect(button).toBeDisabled();
  });

  it("renders empty state when no messages", () => {
    render(<MessageThread {...defaultProps} messages={[]} />);

    const thread = screen.getByTestId("message-thread");
    const bubbles = thread.querySelectorAll('[data-testid="message-bubble"]');
    expect(bubbles).toHaveLength(0);
  });

  it("passes customer info to MessageBubble components", () => {
    render(
      <MessageThread
        {...defaultProps}
        customerName="Jane Smith"
        customerAvatarUrl="https://example.com/avatar.jpg"
      />
    );

    // Customer messages should show initials
    expect(screen.getAllByText("JS")).toHaveLength(2); // Two customer messages
  });

  it("renders all message types correctly", () => {
    render(<MessageThread {...defaultProps} />);

    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Bot response")).toBeInTheDocument();
    expect(screen.getByText("Latest message")).toBeInTheDocument();
    expect(screen.getByText("Bot")).toBeInTheDocument(); // Bot label
  });
});
