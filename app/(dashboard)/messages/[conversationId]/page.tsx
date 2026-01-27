import { Suspense } from "react";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getConversationDetail, markConversationViewed } from "@/actions/conversations";
import { getMessages } from "@/actions/messages";
import { ConversationDetailHeader } from "@/components/features/conversations/ConversationDetailHeader";
import { ConversationDetailWrapper } from "@/components/features/conversations/ConversationDetailWrapper";
import { ConversationDetailSkeleton } from "@/components/features/conversations/ConversationDetailSkeleton";
import { HandoverReasonBanner } from "@/components/features/conversations/HandoverReasonBanner";

// Generate a placeholder param for build-time validation with cacheComponents
// Actual requests will be handled dynamically at runtime
export function generateStaticParams() {
  // Return a placeholder UUID that won't match real conversations
  // This satisfies the cacheComponents requirement for at least one static param
  return [{ conversationId: "00000000-0000-0000-0000-000000000000" }];
}

interface ConversationDetailContainerProps {
  conversationId: string;
}

async function ConversationDetailContainer({
  conversationId,
}: ConversationDetailContainerProps) {
  // Opt out of static rendering - this page requires authentication and dynamic data
  noStore();

  // Get conversation detail
  const detailResult = await getConversationDetail(conversationId);
  if (!detailResult.success) {
    if (detailResult.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{detailResult.error.message}</p>
      </div>
    );
  }

  // Get initial messages
  const messagesResult = await getMessages(conversationId);
  if (!messagesResult.success) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{messagesResult.error.message}</p>
      </div>
    );
  }

  // Mark conversation as viewed (fire and forget)
  markConversationViewed(conversationId).catch((err) => {
    console.error("[ERROR] [CONVERSATIONS] Failed to mark as viewed:", err);
  });

  // Get tenant ID for real-time subscription
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.app_metadata?.tenant_id;

  // Validate tenantId exists before rendering client component
  if (!tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">No business associated with your account</p>
      </div>
    );
  }

  const conversation = detailResult.data;
  const { messages, nextCursor } = messagesResult.data;

  return (
    <div className="flex flex-col h-full">
      <ConversationDetailHeader
        customerName={conversation.customerName}
        customerAvatarUrl={conversation.customerAvatarUrl}
        status={conversation.status}
      />

      {conversation.handoverReason && (
        <HandoverReasonBanner reason={conversation.handoverReason} />
      )}

      <ConversationDetailWrapper
        initialMessages={messages}
        initialCursor={nextCursor}
        conversationId={conversationId}
        tenantId={tenantId}
        customerName={conversation.customerName}
        customerAvatarUrl={conversation.customerAvatarUrl}
      />
    </div>
  );
}

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { conversationId } = await params;

  return (
    <Suspense fallback={<ConversationDetailSkeleton />}>
      <ConversationDetailContainer conversationId={conversationId} />
    </Suspense>
  );
}
