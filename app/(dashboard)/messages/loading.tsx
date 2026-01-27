import { ConversationListSkeleton } from "@/components/features/conversations/ConversationListSkeleton";

export default function MessagesLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="h-8 w-32 mb-6 bg-muted rounded animate-pulse" />
      <ConversationListSkeleton />
    </div>
  );
}
