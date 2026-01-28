import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import type { Message } from "@/types/messages";

interface MessageBubbleProps {
  message: Message;
  customerName: string;
  customerAvatarUrl: string | null;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

export function MessageBubble({
  message,
  customerName,
  customerAvatarUrl,
}: MessageBubbleProps) {
  const isCustomer = message.senderType === "customer";
  const isBot = message.senderType === "bot";
  const isOwner = message.senderType === "owner";

  const initials = getInitials(customerName);

  return (
    <div
      className={cn(
        "flex gap-2 mb-3",
        isCustomer ? "justify-start" : "justify-end",
        message.isHandoverTrigger &&
          "bg-amber-50 -mx-4 px-4 py-2 rounded-lg border border-amber-200"
      )}
      data-testid="message-bubble"
      data-sender-type={message.senderType}
      data-is-handover-trigger={message.isHandoverTrigger || false}
    >
      {isCustomer && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={customerAvatarUrl ?? undefined} alt={customerName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[75%]", isCustomer ? "" : "text-right")}>
        {!isCustomer && (
          <span className="text-xs text-muted-foreground mb-1 block">
            {isBot ? "Bot" : "You"}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 inline-block text-left",
            isCustomer && "bg-muted",
            isBot && "bg-blue-50 text-blue-900",
            isOwner && "bg-primary text-primary-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
