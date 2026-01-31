/**
 * Bot Database Queries
 * Story 4.5: Rules-Based FAQ Matching Engine
 *
 * Database lookup functions for the rules-based bot engine.
 * Uses admin client (service role) since these run in webhook context.
 * All queries filter by tenant_id for multi-tenant isolation.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Product, BusinessInfo } from "./types";

/**
 * Find a product by name using case-insensitive partial matching.
 * Returns the best match or null if no match found.
 *
 * Matching strategy (simple string operations for performance):
 * 1. Exact match (case-insensitive)
 * 2. Product name contains query
 * 3. Query contains product name
 */
export async function findProductByName(
  tenantId: string,
  query: string
): Promise<Product | null> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, currency, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error) {
    console.error("[ERROR] [BOT] Product query failed:", {
      tenantId,
      error: error.message,
    });
    return null;
  }

  if (!products || products.length === 0) {
    return null;
  }

  const normalizedQuery = normalizeWhitespace(query.toLowerCase().trim());

  // 1. Exact match (case-insensitive, whitespace-normalized)
  const exactMatch = products.find(
    (p) => normalizeWhitespace(p.name.toLowerCase()) === normalizedQuery
  );
  if (exactMatch) return exactMatch;

  // 2. Product name contains query (whitespace-normalized)
  const containsMatch = products.find((p) =>
    normalizeWhitespace(p.name.toLowerCase()).includes(normalizedQuery)
  );
  if (containsMatch) return containsMatch;

  // 3. Query contains product name (whitespace-normalized)
  const reverseMatch = products.find((p) =>
    normalizedQuery.includes(normalizeWhitespace(p.name.toLowerCase()))
  );
  if (reverseMatch) return reverseMatch;

  return null;
}

/**
 * Get all active products for a tenant.
 * Used when customer asks for "menu" or product list.
 */
export async function getAllProducts(tenantId: string): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, currency, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("[ERROR] [BOT] Product list query failed:", {
      tenantId,
      error: error.message,
    });
    return [];
  }

  return products ?? [];
}

/**
 * Get business opening hours.
 * Returns parsed JSONB opening_hours or null if not set.
 */
export async function getBusinessHours(
  tenantId: string
): Promise<BusinessInfo["opening_hours"]> {
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("opening_hours")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [BOT] Business hours query failed:", {
      tenantId,
      error: error.message,
    });
    return null;
  }

  return (business?.opening_hours as BusinessInfo["opening_hours"]) ?? null;
}

/**
 * Get business address.
 */
export async function getBusinessAddress(
  tenantId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("address")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [BOT] Business address query failed:", {
      tenantId,
      error: error.message,
    });
    return null;
  }

  return business?.address ?? null;
}

/**
 * Get business phone number.
 */
export async function getBusinessPhone(
  tenantId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("phone")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [BOT] Business phone query failed:", {
      tenantId,
      error: error.message,
    });
    return null;
  }

  return business?.phone ?? null;
}

/**
 * Get business name for personalized responses.
 */
export async function getBusinessName(
  tenantId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [BOT] Business name query failed:", {
      tenantId,
      error: error.message,
    });
    return null;
  }

  return business?.name ?? null;
}

/**
 * Collapse multiple whitespace to single space for normalized comparison.
 * Handles mixed Khmer-English product names where extra spaces may appear.
 */
function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}
