/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/messages";

// Mock date-fns functions for consistent testing
vi.mock("date-fns", () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === "h:mm a") return "10:30 AM";
    if (formatStr === "MMM d, h:mm a") return "Jan 15, 10:30 AM";
    return "10:30 AM";
  }),
  isToday: vi.fn(() => false),
  isYesterday: vi.fn(() => false),
}));

describe("MessageBubble", () => {
  const baseMessage: Message = {
    id: "msg-1",
    conversationId: "conv-1",
    senderType: "customer",
    content: "Hello, I have a question",
    createdAt: "2026-01-15T10:30:00Z",
    isHandoverTrigger: false,
  };

  const customerName = "John Doe";
  const customerAvatarUrl = "https://example.com/avatar.jpg";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders customer message on left with avatar", () => {
    const customerMessage: Message = { ...baseMessage, senderType: "customer" };

    render(
      <MessageBubble
        message={customerMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble).toHaveAttribute("data-sender-type", "customer");
    expect(bubble.className).toContain("justify-start");
    expect(screen.getByText("Hello, I have a question")).toBeInTheDocument();
    // Avatar should be present for customer messages
    expect(screen.getByText("JD")).toBeInTheDocument(); // Fallback initials
  });

  it("renders bot message on right with 'Bot' label", () => {
    const botMessage: Message = { ...baseMessage, senderType: "bot" };

    render(
      <MessageBubble
        message={botMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble).toHaveAttribute("data-sender-type", "bot");
    expect(bubble.className).toContain("justify-end");
    expect(screen.getByText("Bot")).toBeInTheDocument();
    expect(screen.getByText("Hello, I have a question")).toBeInTheDocument();
  });

  it("renders owner message on right with 'You' label", () => {
    const ownerMessage: Message = { ...baseMessage, senderType: "owner" };

    render(
      <MessageBubble
        message={ownerMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble).toHaveAttribute("data-sender-type", "owner");
    expect(bubble.className).toContain("justify-end");
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Hello, I have a question")).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    render(
      <MessageBubble
        message={baseMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    // The mocked format function should be called
    expect(screen.getByText(/10:30 AM|Jan 15/)).toBeInTheDocument();
  });

  it("highlights handover trigger message with amber background", () => {
    const handoverMessage: Message = {
      ...baseMessage,
      isHandoverTrigger: true,
    };

    render(
      <MessageBubble
        message={handoverMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble).toHaveAttribute("data-is-handover-trigger", "true");
    expect(bubble.className).toContain("bg-amber-50");
    expect(bubble.className).toContain("border-amber-200");
  });

  it("does not highlight non-handover messages", () => {
    render(
      <MessageBubble
        message={baseMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const bubble = screen.getByTestId("message-bubble");
    expect(bubble).toHaveAttribute("data-is-handover-trigger", "false");
    expect(bubble.className).not.toContain("bg-amber-50");
  });

  it("applies correct styling for customer messages", () => {
    const customerMessage: Message = { ...baseMessage, senderType: "customer" };

    const { container } = render(
      <MessageBubble
        message={customerMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const messageBubbleInner = container.querySelector(".bg-muted");
    expect(messageBubbleInner).toBeInTheDocument();
  });

  it("applies correct styling for bot messages", () => {
    const botMessage: Message = { ...baseMessage, senderType: "bot" };

    const { container } = render(
      <MessageBubble
        message={botMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const messageBubbleInner = container.querySelector(".bg-blue-50");
    expect(messageBubbleInner).toBeInTheDocument();
  });

  it("applies correct styling for owner messages", () => {
    const ownerMessage: Message = { ...baseMessage, senderType: "owner" };

    const { container } = render(
      <MessageBubble
        message={ownerMessage}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
      />
    );

    const messageBubbleInner = container.querySelector(".bg-primary");
    expect(messageBubbleInner).toBeInTheDocument();
  });

  it("handles null avatar URL by showing initials", () => {
    render(
      <MessageBubble
        message={baseMessage}
        customerName="Jane Smith"
        customerAvatarUrl={null}
      />
    );

    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("shows ? for empty customer name", () => {
    render(
      <MessageBubble
        message={baseMessage}
        customerName=""
        customerAvatarUrl={null}
      />
    );

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
