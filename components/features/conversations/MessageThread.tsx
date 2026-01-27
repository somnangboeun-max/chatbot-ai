import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/messages";

interface MessageThreadProps {
  messages: Message[];
  customerName: string;
  customerAvatarUrl: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export function MessageThread({
  messages,
  customerName,
  customerAvatarUrl,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: MessageThreadProps) {
  // Messages come in DESC order from server, reverse for display (oldest first at top)
  const sortedMessages = [...messages].reverse();

  return (
    <div className="flex-1 px-4 py-4" data-testid="message-thread">
      {hasMore && (
        <div className="text-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            data-testid="load-more-button"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load older messages"
            )}
          </Button>
        </div>
      )}

      {sortedMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          customerName={customerName}
          customerAvatarUrl={customerAvatarUrl}
        />
      ))}
    </div>
  );
}
