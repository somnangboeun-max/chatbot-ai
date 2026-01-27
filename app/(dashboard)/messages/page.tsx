import { Suspense } from "react";
import { getConversations } from "@/actions/conversations";
import { createClient } from "@/lib/supabase/server";
import { ConversationListWrapper } from "@/components/features/conversations/ConversationListWrapper";
import { ConversationListSkeleton } from "@/components/features/conversations/ConversationListSkeleton";

async function ConversationListContainer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId = user?.app_metadata?.tenant_id ?? "";

  const result = await getConversations();

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load conversations</p>
        <p className="text-sm text-muted-foreground mt-1">{result.error.message}</p>
      </div>
    );
  }

  return (
    <ConversationListWrapper
      initialConversations={result.data.conversations}
      initialCursor={result.data.nextCursor}
      tenantId={tenantId}
    />
  );
}

export default function MessagesPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>

      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationListContainer />
      </Suspense>
    </div>
  );
}
