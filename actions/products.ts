"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Product } from "@/types";
import {
  createProductSchema,
  productSchema,
  type CreateProductInput,
  type ProductInput,
} from "@/lib/validations/product";

/**
 * Add Product
 *
 * Creates a new product for the current tenant.
 * Product is immediately available for bot responses.
 */
export async function addProduct(
  data: CreateProductInput
): Promise<ActionResult<Product>> {
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

  const validated = createProductSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid product data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      ...validated.data,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) {
    console.error("[ERROR] [PRODUCTS] Add failed:", {
      tenantId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to add product" },
    };
  }

  console.info("[INFO] [PRODUCTS] Added:", { tenantId, productId: product.id });
  revalidatePath("/settings/products");

  return { success: true, data: product };
}

/**
 * Update Product
 *
 * Updates an existing product's name, price, or currency.
 * Changes are immediately reflected in bot responses.
 */
export async function updateProduct(
  productId: string,
  data: ProductInput
): Promise<ActionResult<Product>> {
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

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid product data",
        details: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  const { data: product, error } = await supabase
    .from("products")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("[ERROR] [PRODUCTS] Update failed:", {
      tenantId,
      productId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update product" },
    };
  }

  console.info("[INFO] [PRODUCTS] Updated:", { tenantId, productId });
  revalidatePath("/settings/products");

  return { success: true, data: product };
}

/**
 * Delete Product (Soft Delete)
 *
 * Marks a product as inactive (is_active = false).
 * The product is preserved for historical data but hidden from users.
 */
export async function deleteProduct(
  productId: string
): Promise<ActionResult<{ deleted: true }>> {
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

  // Soft delete: set is_active = false
  const { error } = await supabase
    .from("products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("[ERROR] [PRODUCTS] Delete failed:", {
      tenantId,
      productId,
      error: error.message,
    });
    return {
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to delete product" },
    };
  }

  console.info("[INFO] [PRODUCTS] Deleted:", { tenantId, productId });
  revalidatePath("/settings/products");

  return { success: true, data: { deleted: true } };
}
