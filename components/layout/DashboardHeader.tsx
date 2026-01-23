import { BotStatusIndicator } from "@/components/features/dashboard/BotStatusIndicator";

interface DashboardHeaderProps {
  businessName: string;
  botActive: boolean;
}

export function DashboardHeader({
  businessName,
  botActive,
}: DashboardHeaderProps) {
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
