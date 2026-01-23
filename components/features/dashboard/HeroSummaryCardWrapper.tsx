"use client";

import { HeroSummaryCard } from "./HeroSummaryCard";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import type { DashboardStats } from "@/types/dashboard";

interface HeroSummaryCardWrapperProps {
  initialStats: DashboardStats;
  tenantId: string;
}

export function HeroSummaryCardWrapper({
  initialStats,
  tenantId,
}: HeroSummaryCardWrapperProps) {
  const stats = useRealtimeStats(tenantId, initialStats);

  return <HeroSummaryCard stats={stats} />;
}
