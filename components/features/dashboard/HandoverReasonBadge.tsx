import { Badge } from "@/components/ui/badge";
import type { HandoverReason } from "@/types/dashboard";

const REASON_CONFIG: Record<HandoverReason, { label: string; className: string }> = {
  low_confidence: { label: "Low confidence", className: "bg-amber-100 text-amber-800 border-amber-200" },
  customer_frustrated: { label: "Frustrated", className: "bg-red-100 text-red-800 border-red-200" },
  human_requested: { label: "Human requested", className: "bg-blue-100 text-blue-800 border-blue-200" },
  complex_question: { label: "Complex", className: "bg-purple-100 text-purple-800 border-purple-200" },
};

interface HandoverReasonBadgeProps {
  reason: HandoverReason;
}

export function HandoverReasonBadge({ reason }: HandoverReasonBadgeProps) {
  const config = REASON_CONFIG[reason];
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
