import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HandoverReasonBadge } from "./HandoverReasonBadge";
import { formatDistanceToNow } from "date-fns";
import type { AttentionItem } from "@/types/dashboard";

interface AttentionItemCardProps {
  item: AttentionItem;
}

export function AttentionItemCard({ item }: AttentionItemCardProps) {
  const initials = item.customerName
    ? item.customerName
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    : "?";

  const truncatedPreview = item.messagePreview
    ? item.messagePreview.length > 60
      ? item.messagePreview.slice(0, 60) + "..."
      : item.messagePreview
    : "No message preview";

  const timeAgo = formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true });
  const isUnviewed = item.viewedAt === null;

  return (
    <Link
      href={`/messages/${item.id}`}
      className="flex items-start gap-3 p-3 min-h-[44px] hover:bg-muted/50 transition-colors border-b last:border-b-0"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={item.customerAvatarUrl ?? undefined} alt={item.customerName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnviewed ? "font-semibold" : ""}`}>
            {item.customerName}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {truncatedPreview}
        </p>
        {item.handoverReason && (
          <div className="mt-1.5">
            <HandoverReasonBadge reason={item.handoverReason} />
          </div>
        )}
      </div>
    </Link>
  );
}
