"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AttentionItemList } from "./AttentionItemList";
import type { AttentionItem, HandoverReason } from "@/types/dashboard";

interface AttentionItemListWrapperProps {
  initialItems: AttentionItem[];
  tenantId: string;
}

export function AttentionItemListWrapper({ initialItems, tenantId }: AttentionItemListWrapperProps) {
  const [items, setItems] = useState<AttentionItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();

    type ConversationPayload = {
      id: string;
      status: string;
      customer_name: string;
      customer_avatar_url: string | null;
      handover_reason: HandoverReason | null;
      last_message_preview: string | null;
      last_message_at: string;
      viewed_at: string | null;
    };

    function toAttentionItem(row: ConversationPayload): AttentionItem {
      return {
        id: row.id,
        customerName: row.customer_name ?? "Unknown",
        customerAvatarUrl: row.customer_avatar_url,
        handoverReason: row.handover_reason,
        messagePreview: row.last_message_preview,
        lastMessageAt: row.last_message_at,
        viewedAt: row.viewed_at,
      };
    }

    const channel = supabase
      .channel(`attention-items:${tenantId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversations",
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        const newConv = payload.new as ConversationPayload;
        if (newConv.status === "needs_attention") {
          setItems((prev) => [toAttentionItem(newConv), ...prev].slice(0, 10));
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        const oldConv = payload.old as ConversationPayload;
        const newConv = payload.new as ConversationPayload;

        if (oldConv.status !== "needs_attention" && newConv.status === "needs_attention") {
          setItems((prev) => [toAttentionItem(newConv), ...prev].slice(0, 10));
        } else if (oldConv.status === "needs_attention" && newConv.status !== "needs_attention") {
          setItems((prev) => prev.filter((item) => item.id !== newConv.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return <AttentionItemList items={items} />;
}
