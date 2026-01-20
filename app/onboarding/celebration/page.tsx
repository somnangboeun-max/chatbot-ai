import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CelebrationScreen } from "@/components/features/onboarding/CelebrationScreen";

/**
 * Celebration Page
 *
 * Shows celebration screen after onboarding completion.
 * Verifies onboarding is complete before displaying.
 * If not complete, redirects back to review step.
 */
export default async function CelebrationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const tenantId = user.app_metadata?.tenant_id;

  if (!tenantId) {
    redirect("/auth/setup-business");
  }

  // Verify onboarding is complete
  const { data: business } = await supabase
    .from("businesses")
    .select("onboarding_completed")
    .eq("id", tenantId)
    .single();

  // If not complete, redirect to review
  if (!business?.onboarding_completed) {
    redirect("/onboarding/review");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <CelebrationScreen />
    </div>
  );
}
