import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationStatusBadge } from "./ConversationStatusBadge";
import { formatDistanceToNow } from "date-fns";
import type { ConversationListItem as ConversationListItemType } from "@/types/conversations";

interface ConversationListItemProps {
  conversation: ConversationListItemType;
}

export function ConversationListItem({ conversation }: ConversationListItemProps) {
  const initials = conversation.customerName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const truncatedPreview = conversation.lastMessagePreview
    ? conversation.lastMessagePreview.length > 50
      ? conversation.lastMessagePreview.slice(0, 50) + "..."
      : conversation.lastMessagePreview
    : "No messages yet";

  const timeAgo = formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true });
  const isUnviewed = conversation.viewedAt === null;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 p-4 min-h-[56px] hover:bg-muted/50 transition-colors border-b last:border-b-0"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={conversation.customerAvatarUrl ?? undefined} alt={conversation.customerName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnviewed ? "font-semibold" : ""}`}>
            {conversation.customerName}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {truncatedPreview}
        </p>
      </div>
      <ConversationStatusBadge status={conversation.status} />
    </Link>
  );
}
