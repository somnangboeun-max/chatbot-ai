"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export interface BotStatusResult {
  botActive: boolean;
  pausedAt: string | null;
}

export async function toggleBotStatus(
  active: boolean,
): Promise<ActionResult<BotStatusResult>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("businesses")
      .update({
        bot_active: active,
        bot_paused_at: active ? null : now,
      })
      .eq("id", tenantId)
      .select("bot_active, bot_paused_at")
      .single();

    if (error) throw error;

    console.info("[INFO] [BOT] Status toggled:", { tenantId, botActive: active });
    return {
      success: true,
      data: {
        botActive: data.bot_active,
        pausedAt: data.bot_paused_at,
      },
    };
  } catch (error) {
    console.error("[ERROR] [BOT] Toggle failed:", { tenantId, error });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update bot status" },
    };
  }
}
