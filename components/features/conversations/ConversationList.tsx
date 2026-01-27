import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import type { ConversationListItem as ConversationListItemType } from "@/types/conversations";

interface ConversationListProps {
  conversations: ConversationListItemType[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export function ConversationList({ conversations, hasMore, onLoadMore, isLoadingMore }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Messages from your customers will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {conversations.map((conversation) => (
          <ConversationListItem key={conversation.id} conversation={conversation} />
        ))}
        {hasMore && (
          <div className="p-4 text-center border-t">
            <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
