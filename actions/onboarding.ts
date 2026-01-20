"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import {
  businessNameSchema,
  businessHoursSchema,
  locationSchema,
  contactSchema,
  productsArraySchema,
  type BusinessNameInput,
  type BusinessHoursInput,
  type LocationInput,
  type ContactInput,
  type ProductInput,
  type ProductsInput,
} from "@/lib/validations/onboarding";

/**
 * Save Step 1: Business Name
 */
export async function saveBusinessName(
  data: BusinessNameInput
): Promise<ActionResult<{ nextStep: number }>> {
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

  const validated = businessNameSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid business name",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ name: validated.data.name })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [ONBOARDING] Save business name failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  console.info("[INFO] [ONBOARDING] Step 1 saved:", { tenantId });
  revalidatePath("/onboarding");

  return { success: true, data: { nextStep: 2 } };
}

/**
 * Save Step 2: Business Hours
 */
export async function saveBusinessHours(
  data: BusinessHoursInput
): Promise<ActionResult<{ nextStep: number }>> {
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

  const validated = businessHoursSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid business hours",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ opening_hours: validated.data.opening_hours })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [ONBOARDING] Save business hours failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  console.info("[INFO] [ONBOARDING] Step 2 saved:", { tenantId });
  revalidatePath("/onboarding");

  return { success: true, data: { nextStep: 3 } };
}

/**
 * Save Step 3: Location
 */
export async function saveLocation(
  data: LocationInput
): Promise<ActionResult<{ nextStep: number }>> {
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

  const validated = locationSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid location data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  // Store location data as JSON to preserve structure for back navigation
  const locationData = JSON.stringify({
    street: validated.data.address,
    city: validated.data.city,
    landmarks: validated.data.landmarks ?? "",
  });

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ address: locationData })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [ONBOARDING] Save location failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  console.info("[INFO] [ONBOARDING] Step 3 saved:", { tenantId });
  revalidatePath("/onboarding");

  return { success: true, data: { nextStep: 4 } };
}

/**
 * Save Step 4: Contact Phone
 */
export async function saveContact(
  data: ContactInput
): Promise<ActionResult<{ nextStep: number }>> {
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

  const validated = contactSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid phone number",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ phone: validated.data.phone })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [ONBOARDING] Save contact failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  console.info("[INFO] [ONBOARDING] Step 4 saved:", { tenantId });
  revalidatePath("/onboarding");

  return { success: true, data: { nextStep: 5 } };
}

/**
 * Get Onboarding Progress
 *
 * Fetches current business data for pre-populating forms.
 */
export async function getOnboardingProgress(): Promise<
  ActionResult<{
    currentStep: number;
    data: {
      name: string | null;
      opening_hours: Record<
        string,
        { open?: string; close?: string; closed?: boolean }
      > | null;
      address: string | null;
      city: string | null;
      landmarks: string | null;
      phone: string | null;
      onboarding_completed: boolean;
    };
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
    .select("name, opening_hours, address, phone, onboarding_completed")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [ONBOARDING] Fetch progress failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load data" },
    };
  }

  // Determine current step based on what's filled
  let currentStep = 1;
  if (business.name && business.name !== "My Business") currentStep = 2;
  if (business.opening_hours) currentStep = 3;
  if (business.address) currentStep = 4;
  if (business.phone) currentStep = 5;

  // Parse location JSON if present (new format), fallback to legacy string
  let addressData = { street: "", city: "", landmarks: "" };
  if (business.address) {
    try {
      const parsed = JSON.parse(business.address) as {
        street?: string;
        city?: string;
        landmarks?: string;
      };
      addressData = {
        street: parsed.street ?? "",
        city: parsed.city ?? "",
        landmarks: parsed.landmarks ?? "",
      };
    } catch {
      // Legacy format: plain string address, put it all in street
      addressData = { street: business.address, city: "", landmarks: "" };
    }
  }

  return {
    success: true,
    data: {
      currentStep,
      data: {
        name: business.name,
        opening_hours: business.opening_hours as Record<
          string,
          { open?: string; close?: string; closed?: boolean }
        > | null,
        address: addressData.street || null,
        city: addressData.city || null,
        landmarks: addressData.landmarks || null,
        phone: business.phone,
        onboarding_completed: business.onboarding_completed,
      },
    },
  };
}

/**
 * Complete Onboarding
 *
 * Marks the business onboarding as complete.
 * Called after all steps are finished (Story 2.3).
 */
export async function completeOnboarding(): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ onboarding_completed: true })
    .eq("id", tenantId);

  if (updateError) {
    console.error("[ERROR] [ONBOARDING] Complete onboarding failed:", {
      tenantId,
      error: updateError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to complete onboarding" },
    };
  }

  console.info("[INFO] [ONBOARDING] Onboarding completed:", { tenantId });
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

/**
 * Save Step 5: Products
 *
 * Saves products for the current tenant.
 * Uses full replacement strategy: deletes existing, inserts new array.
 */
export async function saveProducts(
  data: ProductsInput
): Promise<ActionResult<{ nextStep: string }>> {
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

  const validated = productsArraySchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid products data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "No business associated" },
    };
  }

  // Delete existing products for this tenant (full replacement)
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteError) {
    console.error("[ERROR] [ONBOARDING] Delete products failed:", {
      tenantId,
      error: deleteError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  // Insert new products
  const productsToInsert = validated.data.products.map((p) => ({
    tenant_id: tenantId,
    name: p.name,
    price: p.price,
    currency: p.currency,
    is_active: true,
  }));

  const { error: insertError } = await supabase
    .from("products")
    .insert(productsToInsert);

  if (insertError) {
    console.error("[ERROR] [ONBOARDING] Insert products failed:", {
      tenantId,
      count: productsToInsert.length,
      error: insertError.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to save. Please try again." },
    };
  }

  console.info("[INFO] [ONBOARDING] Step 5 saved:", {
    tenantId,
    productCount: productsToInsert.length,
  });
  revalidatePath("/onboarding");

  return { success: true, data: { nextStep: "review" } };
}

/**
 * Get Products for Tenant
 *
 * Fetches all active products for the current tenant.
 */
export async function getProducts(): Promise<ActionResult<ProductInput[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, currency")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[ERROR] [ONBOARDING] Fetch products failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to load products" },
    };
  }

  return {
    success: true,
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      currency: p.currency as "USD" | "KHR",
    })),
  };
}
