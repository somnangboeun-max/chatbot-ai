import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Admin Supabase client using service role key
 * SECURITY: Only use server-side for operations requiring RLS bypass
 *
 * Use cases:
 * - Initial business creation during signup (user has no tenant_id yet)
 * - Setting JWT claims via admin.updateUserById
 * - Webhook processing that needs cross-tenant access
 *
 * NEVER:
 * - Use in client-side code
 * - Pass to client components
 * - Use for regular user operations
 */
export function createAdminClient() {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "[ERROR] [SUPABASE] SUPABASE_SERVICE_ROLE_KEY is required for admin operations"
    );
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
