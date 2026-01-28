import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ConversationStatusBadge } from "./ConversationStatusBadge";
import type { ConversationStatus } from "@/types/conversations";

interface ConversationDetailHeaderProps {
  customerName: string;
  customerAvatarUrl: string | null;
  status: ConversationStatus;
}

export function ConversationDetailHeader({
  customerName,
  customerAvatarUrl,
  status,
}: ConversationDetailHeaderProps) {
  const initials = getInitials(customerName);

  return (
    <header
      className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3"
      data-testid="conversation-detail-header"
    >
      <Link
        href="/messages"
        className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <Avatar className="h-10 w-10">
        <AvatarImage src={customerAvatarUrl ?? undefined} alt={customerName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-base truncate">{customerName}</h1>
      </div>

      <ConversationStatusBadge status={status} />
    </header>
  );
}
