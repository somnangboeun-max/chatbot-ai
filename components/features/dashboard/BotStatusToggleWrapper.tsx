"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleBotStatus } from "@/actions/bot";
import { useBotStatus } from "@/hooks/useBotStatus";
import { BotStatusToggle } from "./BotStatusToggle";
import { PausedWarningBanner } from "./PausedWarningBanner";

interface BotStatusToggleWrapperProps {
  initialBotActive: boolean;
  tenantId: string;
}

export function BotStatusToggleWrapper({
  initialBotActive,
  tenantId,
}: BotStatusToggleWrapperProps) {
  const botActive = useBotStatus(tenantId, initialBotActive);
  const [optimisticActive, setOptimisticActive] = useState(botActive);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimisticActive(botActive);
  }, [botActive]);

  const handleToggle = (newActive: boolean) => {
    setOptimisticActive(newActive);
    startTransition(async () => {
      const result = await toggleBotStatus(newActive);
      if (!result.success) {
        setOptimisticActive(!newActive);
        toast.error(result.error.message);
      } else {
        toast.success(newActive ? "Bot resumed" : "Bot paused");
      }
    });
  };

  return (
    <>
      {!optimisticActive && (
        <div className="mb-4">
          <PausedWarningBanner
            onResume={() => handleToggle(true)}
            isPending={isPending}
          />
        </div>
      )}
      <BotStatusToggle
        botActive={optimisticActive}
        isPending={isPending}
        onToggle={handleToggle}
      />
    </>
  );
}
