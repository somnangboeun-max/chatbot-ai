import type { HandoverReason } from "./dashboard";

export type ConversationStatus =
  | "active"
  | "bot_handled"
  | "needs_attention"
  | "owner_handled";

export interface ConversationListItem {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  status: ConversationStatus;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  viewedAt: string | null;
}

export interface ConversationDetail {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  status: ConversationStatus;
  handoverReason: HandoverReason | null;
  viewedAt: string | null;
}
