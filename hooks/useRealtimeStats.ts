"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/types/dashboard";

export function useRealtimeStats(
  tenantId: string,
  initialStats: DashboardStats,
) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard-stats:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newMessage = payload.new as {
            sender_type: string;
            created_at: string;
          };
          if (newMessage.sender_type === "bot") {
            const messageTime = new Date(newMessage.created_at);
            const hour = messageTime.getHours();
            const isOvernightHour = hour >= 22 || hour < 8;

            setStats((prev) => ({
              ...prev,
              messagesHandledToday: prev.messagesHandledToday + 1,
              messagesHandledThisWeek: prev.messagesHandledThisWeek + 1,
              overnightMessages: isOvernightHour
                ? prev.overnightMessages + 1
                : prev.overnightMessages,
              hasOvernightMessages: isOvernightHour
                ? true
                : prev.hasOvernightMessages,
            }));
          }
        },
      )
      .subscribe();

    const conversationChannel = supabase
      .channel(`dashboard-attention:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const oldConv = payload.old as { status: string };
          const newConv = payload.new as { status: string };
          if (
            oldConv.status !== "needs_attention" &&
            newConv.status === "needs_attention"
          ) {
            setStats((prev) => ({
              ...prev,
              attentionNeeded: prev.attentionNeeded + 1,
            }));
          } else if (
            oldConv.status === "needs_attention" &&
            newConv.status !== "needs_attention"
          ) {
            setStats((prev) => ({
              ...prev,
              attentionNeeded: Math.max(0, prev.attentionNeeded - 1),
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(conversationChannel);
    };
  }, [tenantId]);

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  return stats;
}
