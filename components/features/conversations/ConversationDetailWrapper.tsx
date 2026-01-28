"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/actions/messages";
import { MessageThread } from "./MessageThread";
import { NewMessageIndicator } from "./NewMessageIndicator";
import type { Message } from "@/types/messages";

const messageSenderTypeSchema = z.enum(["customer", "bot", "owner"]);

interface ConversationDetailWrapperProps {
  initialMessages: Message[];
  initialCursor: string | null;
  conversationId: string;
  tenantId: string;
  customerName: string;
  customerAvatarUrl: string | null;
}

export function ConversationDetailWrapper({
  initialMessages,
  initialCursor,
  conversationId,
  tenantId,
  customerName,
  customerAvatarUrl,
}: ConversationDetailWrapperProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialCursor !== null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Use ref for isScrolledUp to avoid recreating subscription on scroll changes
  const isScrolledUpRef = useRef(false);
  // Track if component is mounted to prevent stale closure issues in async callbacks
  const isMountedRef = useRef(true);

  // Keep ref in sync with state
  useEffect(() => {
    isScrolledUpRef.current = isScrolledUp;
  }, [isScrolledUp]);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    setNewMessageCount(0);
    setIsScrolledUp(false);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!cursor || isLoadingMore) return;

    const previousScrollHeight = scrollContainerRef.current?.scrollHeight ?? 0;

    setIsLoadingMore(true);
    setError(null);

    const result = await getMessages(conversationId, cursor);

    if (result.success) {
      setMessages((prev) => [...result.data.messages, ...prev]);
      setCursor(result.data.nextCursor);
      setHasMore(result.data.nextCursor !== null);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    } else {
      setError(result.error.message);
    }

    setIsLoadingMore(false);
  }, [cursor, conversationId, isLoadingMore]);

  // Handle scroll position tracking
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsScrolledUp(!isAtBottom);
      if (isAtBottom) {
        setNewMessageCount(0);
      }
    }
  }, []);

  // Set mounted ref on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !tenantId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages-detail:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const newMsg = payload.new as {
            id: string;
            conversation_id: string;
            sender_type: string;
            content: string;
            created_at: string;
            is_handover_trigger: boolean | null;
          };

          const parsedSenderType = messageSenderTypeSchema.safeParse(newMsg.sender_type);
          const newMessage: Message = {
            id: newMsg.id,
            conversationId: newMsg.conversation_id,
            senderType: parsedSenderType.success ? parsedSenderType.data : "customer",
            content: newMsg.content,
            createdAt: newMsg.created_at,
            isHandoverTrigger: newMsg.is_handover_trigger ?? false,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Use ref to check scroll state without recreating subscription
          if (isScrolledUpRef.current) {
            setNewMessageCount((prev) => prev + 1);
          } else {
            // Auto-scroll to bottom with mounted check
            requestAnimationFrame(() => {
              if (isMountedRef.current && scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const updatedMsg = payload.new as {
            id: string;
            conversation_id: string;
            sender_type: string;
            content: string;
            created_at: string;
            is_handover_trigger: boolean | null;
          };

          const parsedSenderType = messageSenderTypeSchema.safeParse(updatedMsg.sender_type);
          const updatedMessage: Message = {
            id: updatedMsg.id,
            conversationId: updatedMsg.conversation_id,
            senderType: parsedSenderType.success ? parsedSenderType.data : "customer",
            content: updatedMsg.content,
            createdAt: updatedMsg.created_at,
            isHandoverTrigger: updatedMsg.is_handover_trigger ?? false,
          };

          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;
          const deletedMsg = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== deletedMsg.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, tenantId]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Sync with props changes
  useEffect(() => {
    setMessages(initialMessages);
    setCursor(initialCursor);
    setHasMore(initialCursor !== null);
  }, [initialMessages, initialCursor]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full relative overflow-y-auto"
      ref={scrollContainerRef}
      onScroll={handleScroll}
      data-testid="conversation-detail-wrapper"
    >
      <MessageThread
        messages={messages}
        customerName={customerName}
        customerAvatarUrl={customerAvatarUrl}
        hasMore={hasMore}
        onLoadMore={loadOlderMessages}
        isLoadingMore={isLoadingMore}
      />

      {isScrolledUp && newMessageCount > 0 && (
        <NewMessageIndicator count={newMessageCount} onClick={scrollToBottom} />
      )}
    </div>
  );
}
