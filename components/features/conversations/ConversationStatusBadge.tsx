import { Badge } from "@/components/ui/badge";
import type { ConversationStatus } from "@/types/conversations";

const STATUS_CONFIG: Record<ConversationStatus, { label: string; className: string }> = {
  bot_handled: { label: "Bot handled", className: "bg-green-100 text-green-800 border-green-200" },
  needs_attention: { label: "Needs attention", className: "bg-amber-100 text-amber-800 border-amber-200" },
  owner_handled: { label: "You replied", className: "bg-blue-100 text-blue-800 border-blue-200" },
  active: { label: "Active", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

interface ConversationStatusBadgeProps {
  status: ConversationStatus;
}

export function ConversationStatusBadge({ status }: ConversationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
