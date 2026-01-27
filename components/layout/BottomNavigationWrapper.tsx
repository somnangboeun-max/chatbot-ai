"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNavigation } from "./BottomNavigation";

interface BottomNavigationWrapperProps {
  initialCount: number;
  tenantId: string;
}

export function BottomNavigationWrapper({
  initialCount,
  tenantId,
}: BottomNavigationWrapperProps) {
  const [messagesCount, setMessagesCount] = useState(initialCount);

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`nav-attention:${tenantId}`)
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
            setMessagesCount((prev) => prev + 1);
          } else if (
            oldConv.status === "needs_attention" &&
            newConv.status !== "needs_attention"
          ) {
            setMessagesCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newConv = payload.new as { status: string };
          if (newConv.status === "needs_attention") {
            setMessagesCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const oldConv = payload.old as { status: string };
          if (oldConv.status === "needs_attention") {
            setMessagesCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  useEffect(() => {
    setMessagesCount(initialCount);
  }, [initialCount]);

  return <BottomNavigation messagesCount={messagesCount} />;
}
