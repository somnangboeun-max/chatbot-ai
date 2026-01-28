"use client";

import { ChevronDown } from "lucide-react";

interface NewMessageIndicatorProps {
  count: number;
  onClick: () => void;
}

export function NewMessageIndicator({ count, onClick }: NewMessageIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
      data-testid="new-message-indicator"
      role="status"
      aria-live="polite"
      aria-label={count === 1 ? "1 new message, click to scroll to bottom" : `${count} new messages, click to scroll to bottom`}
    >
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm font-medium">
        {count === 1 ? "New message" : `${count} new messages`}
      </span>
    </button>
  );
}
