import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
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

      {sortedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-sm">No messages yet</p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Messages will appear here when the conversation starts
          </p>
        </div>
      ) : (
        sortedMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            customerName={customerName}
            customerAvatarUrl={customerAvatarUrl}
          />
        ))
      )}
    </div>
  );
}
