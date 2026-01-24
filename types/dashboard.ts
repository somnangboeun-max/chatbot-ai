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

export type HandoverReason =
  | "low_confidence"
  | "customer_frustrated"
  | "human_requested"
  | "complex_question";

export interface AttentionItem {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  handoverReason: HandoverReason | null;
  messagePreview: string | null;
  lastMessageAt: string;
  viewedAt: string | null;
}
