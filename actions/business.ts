"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Business } from "@/types";
import {
  businessInfoSchema,
  businessHoursSchema,
  type BusinessInfoInput,
  type BusinessHoursInput,
} from "@/lib/validations/business";

/**
 * Update Business Info
 *
 * Updates business profile information (name, location, phone).
 * Auto-saves on field blur from settings page.
 */
export async function updateBusinessInfo(
  data: BusinessInfoInput
): Promise<ActionResult<Business>> {
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

  const validated = businessInfoSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  // Build location JSON for address field
  const locationData = JSON.stringify({
    street: validated.data.address ?? "",
    city: validated.data.city ?? "",
    landmarks: validated.data.landmarks ?? "",
  });

  const { data: business, error } = await supabase
    .from("businesses")
    .update({
      name: validated.data.name,
      address: locationData,
      phone: validated.data.phone || null,
    })
    .eq("id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("[ERROR] [BUSINESS] Update failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save changes" },
    };
  }

  console.info("[INFO] [BUSINESS] Updated:", { tenantId });
  revalidatePath("/settings/business");
  revalidatePath("/dashboard");

  return { success: true, data: business };
}

/**
 * Update Business Hours
 *
 * Updates opening hours for all 7 days.
 * Bot uses these hours for automated responses.
 */
export async function updateBusinessHours(
  data: BusinessHoursInput
): Promise<ActionResult<Business>> {
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

  const validated = businessHoursSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid hours data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .update({ opening_hours: validated.data })
    .eq("id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("[ERROR] [BUSINESS] Hours update failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save hours" },
    };
  }

  console.info("[INFO] [BUSINESS] Hours updated:", { tenantId });
  revalidatePath("/settings/business");
  revalidatePath("/dashboard");

  return { success: true, data: business };
}
