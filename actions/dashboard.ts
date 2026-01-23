"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export interface DashboardData {
  businessName: string;
  botActive: boolean;
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
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

  const { data: business, error } = await supabase
    .from("businesses")
    .select("name, bot_active")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [DASHBOARD] Data fetch failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load dashboard data" },
    };
  }

  console.info("[INFO] [DASHBOARD] Data fetched:", { tenantId });

  return {
    success: true,
    data: {
      businessName: business.name,
      botActive: business.bot_active ?? true,
    },
  };
}
