export type { DashboardData } from "@/actions/dashboard";

export interface DashboardStats {
  messagesHandledToday: number;
  messagesHandledThisWeek: number;
  overnightMessages: number;
  ordersCaptured: number;
  attentionNeeded: number;
  hasOvernightMessages: boolean;
}

export interface DashboardStatsResult {
  stats: DashboardStats;
  tenantId: string;
}
