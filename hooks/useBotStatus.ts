"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useBotStatus(tenantId: string, initialActive: boolean): boolean {
  const [botActive, setBotActive] = useState(initialActive);

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`bot-status:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "businesses",
          filter: `id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as { bot_active: boolean };
          setBotActive(updated.bot_active);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  useEffect(() => {
    setBotActive(initialActive);
  }, [initialActive]);

  return botActive;
}
