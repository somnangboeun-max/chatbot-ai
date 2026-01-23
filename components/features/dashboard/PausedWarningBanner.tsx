"use client";

import { Button } from "@/components/ui/button";

interface PausedWarningBannerProps {
  onResume: () => void;
  isPending?: boolean;
}

export function PausedWarningBanner({
  onResume,
  isPending,
}: PausedWarningBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-destructive">
        Your bot is paused — messages are not being answered
      </p>
      <Button
        size="sm"
        variant="destructive"
        onClick={onResume}
        disabled={isPending}
        className="min-h-[44px] shrink-0"
      >
        Resume
      </Button>
    </div>
  );
}
