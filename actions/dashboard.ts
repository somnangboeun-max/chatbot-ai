"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import type { DashboardStats, DashboardStatsResult } from "@/types/dashboard";
import { getDashboardDataCached } from "@/lib/queries/dashboard";

export type { DashboardData } from "@/lib/queries/dashboard";

export async function getDashboardData() {
  return getDashboardDataCached();
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStatsResult>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Calculate overnight window (10pm-8am)
  const hour = now.getHours();
  let overnightStart: Date;
  let overnightEnd: Date;

  if (hour < 8) {
    // Before 8am: overnight = 10pm yesterday to now
    overnightStart = new Date(todayStart);
    overnightStart.setDate(overnightStart.getDate() - 1);
    overnightStart.setHours(22, 0, 0, 0);
    overnightEnd = now;
  } else {
    // After 8am: overnight = 10pm yesterday to 8am today
    overnightStart = new Date(todayStart);
    overnightStart.setDate(overnightStart.getDate() - 1);
    overnightStart.setHours(22, 0, 0, 0);
    overnightEnd = new Date(todayStart);
    overnightEnd.setHours(8, 0, 0, 0);
  }

  try {
    const [todayResult, weekResult, overnightResult, attentionResult] =
      await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("sender_type", "bot")
          .gte("created_at", todayStart.toISOString()),

        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("sender_type", "bot")
          .gte("created_at", weekStart.toISOString()),

        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("sender_type", "bot")
          .gte("created_at", overnightStart.toISOString())
          .lte("created_at", overnightEnd.toISOString()),

        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "needs_attention"),
      ]);

    const stats: DashboardStats = {
      messagesHandledToday: todayResult.count ?? 0,
      messagesHandledThisWeek: weekResult.count ?? 0,
      overnightMessages: overnightResult.count ?? 0,
      ordersCaptured: 0, // Placeholder until order tracking (Epic 4+)
      attentionNeeded: attentionResult.count ?? 0,
      hasOvernightMessages: (overnightResult.count ?? 0) > 0,
    };

    console.info("[INFO] [DASHBOARD] Stats fetched:", { tenantId });
    return { success: true, data: { stats, tenantId } };
  } catch (error) {
    console.error("[ERROR] [DASHBOARD] Stats fetch failed:", {
      tenantId,
      error,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load stats" },
    };
  }
}
