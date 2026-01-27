import { AlertTriangle } from "lucide-react";
import type { HandoverReason } from "@/types";

const REASON_MESSAGES: Record<HandoverReason, string> = {
  low_confidence: "Bot wasn't sure how to answer",
  customer_frustrated: "Customer seemed frustrated",
  human_requested: "Customer asked for a human",
  complex_question: "Complex question detected",
};

interface HandoverReasonBannerProps {
  reason: HandoverReason;
}

export function HandoverReasonBanner({ reason }: HandoverReasonBannerProps) {
  return (
    <div
      className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2"
      data-testid="handover-reason-banner"
      data-reason={reason}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800">
        <span className="font-medium">Needs attention:</span>{" "}
        {REASON_MESSAGES[reason]}
      </p>
    </div>
  );
}
