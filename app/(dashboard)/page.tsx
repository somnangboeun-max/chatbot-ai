import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard";
import { HeroSummaryCardWrapper } from "@/components/features/dashboard/HeroSummaryCardWrapper";
import { HeroSummaryCardSkeleton } from "@/components/features/dashboard/HeroSummaryCard";

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

export default function DashboardPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

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
