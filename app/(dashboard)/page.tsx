import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats, getAttentionItems } from "@/actions/dashboard";
import { getDashboardDataCached } from "@/lib/queries/dashboard";
import { HeroSummaryCardWrapper } from "@/components/features/dashboard/HeroSummaryCardWrapper";
import { HeroSummaryCardSkeleton } from "@/components/features/dashboard/HeroSummaryCard";
import { BotStatusToggleWrapper } from "@/components/features/dashboard/BotStatusToggleWrapper";
import { AttentionItemListWrapper } from "@/components/features/dashboard/AttentionItemListWrapper";

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

async function AttentionItemListAsync() {
  const result = await getAttentionItems();

  if (!result.success) {
    return <AttentionItemListWrapper initialItems={[]} tenantId="" />;
  }

  return (
    <AttentionItemListWrapper
      initialItems={result.data.items}
      tenantId={result.data.tenantId}
    />
  );
}

function AttentionItemListSkeleton() {
  return (
    <div>
      <div className="h-7 w-48 bg-muted rounded mb-4 animate-pulse" />
      <Card>
        <CardContent className="p-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 border-b last:border-b-0 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-4 w-48 bg-muted rounded mt-1" />
                <div className="h-5 w-20 bg-muted rounded mt-1.5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
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

      {/* Attention Items List */}
      <div>
        <Suspense fallback={<AttentionItemListSkeleton />}>
          <AttentionItemListAsync />
        </Suspense>
      </div>
    </div>
  );
}
