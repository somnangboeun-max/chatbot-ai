"use client";

import { BotStatusIndicator } from "@/components/features/dashboard/BotStatusIndicator";
import { useBotStatus } from "@/hooks/useBotStatus";

interface DashboardHeaderClientProps {
  businessName: string;
  initialBotActive: boolean;
  tenantId: string;
}

export function DashboardHeaderClient({
  businessName,
  initialBotActive,
  tenantId,
}: DashboardHeaderClientProps) {
  const botActive = useBotStatus(tenantId, initialBotActive);

  return (
    <header
      className="sticky top-0 z-40 bg-background border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-semibold truncate max-w-[200px]">
          {businessName}
        </h1>
        <BotStatusIndicator isActive={botActive} variant="compact" />
      </div>
    </header>
  );
}
