export type MessageSenderType = "customer" | "bot" | "owner";

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  content: string;
  createdAt: string;
  isHandoverTrigger?: boolean;
}
