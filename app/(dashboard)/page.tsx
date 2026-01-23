import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard";
import { getDashboardDataCached } from "@/lib/queries/dashboard";
import { HeroSummaryCardWrapper } from "@/components/features/dashboard/HeroSummaryCardWrapper";
import { HeroSummaryCardSkeleton } from "@/components/features/dashboard/HeroSummaryCard";
import { BotStatusToggleWrapper } from "@/components/features/dashboard/BotStatusToggleWrapper";

const emptyStats = {
  messagesHandledToday: 0,
  messagesHandledThisWeek: 0,
  overnightMessages: 0,
  ordersCaptured: 0,
  attentionNeeded: 0,
  hasOvernightMessages: false,
};

async function HeroSummaryCardAsync() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <HeroSummaryCardWrapper initialStats={emptyStats} tenantId="" />
    );
  }

  return (
    <HeroSummaryCardWrapper
      initialStats={result.data.stats}
      tenantId={result.data.tenantId}
    />
  );
}

async function BotStatusToggleAsync() {
  const result = await getDashboardDataCached();

  if (!result.success) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
        <p className="text-sm text-muted-foreground">
          Unable to load bot status
        </p>
      </div>
    );
  }

  return (
    <BotStatusToggleWrapper
      initialBotActive={result.data.botActive}
      tenantId={result.data.tenantId}
    />
  );
}

function BotStatusToggleSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-muted" />
        <div>
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-1" />
        </div>
      </div>
      <div className="h-7 w-12 bg-muted rounded-full" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Bot Status Toggle with Warning Banner */}
      <div className="mb-6">
        <Suspense fallback={<BotStatusToggleSkeleton />}>
          <BotStatusToggleAsync />
        </Suspense>
      </div>

      {/* Hero Summary Card with real-time stats */}
      <div className="mb-6">
        <Suspense fallback={<HeroSummaryCardSkeleton />}>
          <HeroSummaryCardAsync />
        </Suspense>
      </div>

      {/* Placeholder for AttentionItems (Story 3.4) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Attention Needed</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">All caught up!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
