"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getConversations } from "@/actions/conversations";
import { ConversationList } from "./ConversationList";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { ConversationListItem, ConversationStatus } from "@/types/conversations";

interface ConversationListWrapperProps {
  initialConversations: ConversationListItem[];
  initialCursor: string | null;
  tenantId: string;
}

export function ConversationListWrapper({
  initialConversations,
  initialCursor,
  tenantId,
}: ConversationListWrapperProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialCursor !== null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull-to-refresh state
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    const result = await getConversations();

    if (result.success) {
      setConversations(result.data.conversations);
      setCursor(result.data.nextCursor);
      setHasMore(result.data.nextCursor !== null);
    } else {
      setError(result.error.message);
    }
    setIsRefreshing(false);
    setPullDistance(0);
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);
    const result = await getConversations(cursor);

    if (result.success) {
      setConversations((prev) => [...prev, ...result.data.conversations]);
      setCursor(result.data.nextCursor);
      setHasMore(result.data.nextCursor !== null);
    } else {
      setError(result.error.message);
    }
    setIsLoadingMore(false);
  }, [cursor, isLoadingMore]);

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (containerRef.current?.scrollTop === 0 && touch) {
      touchStartY.current = touch.clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const touch = e.touches[0];
    if (!touch) return;

    const touchY = touch.clientY;
    const distance = Math.max(0, touchY - touchStartY.current);
    setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD + 20));
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      refresh();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [pullDistance, isRefreshing, refresh]);

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();

    type ConversationPayload = {
      id: string;
      customer_name: string;
      customer_avatar_url: string | null;
      status: ConversationStatus;
      last_message_preview: string | null;
      last_message_at: string;
      viewed_at: string | null;
    };

    const channel = supabase
      .channel(`conversations-list:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newConv = payload.new as ConversationPayload;
            const newItem: ConversationListItem = {
              id: newConv.id,
              customerName: newConv.customer_name ?? "Unknown",
              customerAvatarUrl: newConv.customer_avatar_url,
              status: newConv.status,
              lastMessagePreview: newConv.last_message_preview,
              lastMessageAt: newConv.last_message_at,
              viewedAt: newConv.viewed_at,
            };
            setConversations((prev) => [newItem, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedConv = payload.new as ConversationPayload;
            setConversations((prev) =>
              prev
                .map((conv) =>
                  conv.id === updatedConv.id
                    ? {
                        id: updatedConv.id,
                        customerName: updatedConv.customer_name ?? "Unknown",
                        customerAvatarUrl: updatedConv.customer_avatar_url,
                        status: updatedConv.status,
                        lastMessagePreview: updatedConv.last_message_preview,
                        lastMessageAt: updatedConv.last_message_at,
                        viewedAt: updatedConv.viewed_at,
                      }
                    : conv
                )
                .sort(
                  (a, b) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setConversations((prev) => prev.filter((conv) => conv.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  useEffect(() => {
    setConversations(initialConversations);
    setCursor(initialCursor);
    setHasMore(initialCursor !== null);
  }, [initialConversations, initialCursor]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <RefreshCw
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
          }}
        />
      </div>

      {/* Refresh button for non-touch devices */}
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="text-muted-foreground"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <ConversationList
        conversations={conversations}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
}
