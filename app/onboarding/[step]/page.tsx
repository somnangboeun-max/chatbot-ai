import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard";

const VALID_STEPS = ["1", "2", "3", "4", "5", "review"];
const TOTAL_STEPS = 5;

interface OnboardingStepPageProps {
  params: Promise<{ step: string }>;
}

/**
 * Dynamic Onboarding Step Page
 *
 * Handles routing for each step of the onboarding wizard.
 * Steps 1-4 are implemented in this story (2.1):
 *   1. Business Name
 *   2. Business Hours
 *   3. Location
 *   4. Contact Phone
 *
 * Step 5 (Products) and Review are implemented in Stories 2.2 and 2.3.
 */
export default async function OnboardingStepPage({
  params,
}: OnboardingStepPageProps) {
  const { step } = await params;

  // Validate step parameter
  if (!VALID_STEPS.includes(step)) {
    notFound();
  }

  // Get current user and business data
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

  // Fetch business data for pre-population
  const { data: business, error } = await supabase
    .from("businesses")
    .select("name, opening_hours, address, phone, onboarding_completed")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [ONBOARDING] Failed to fetch business:", {
      tenantId,
      error: error.message,
    });
  }

  // If onboarding is complete, redirect to dashboard
  if (business?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Parse step number (handle "review" as a special case)
  const currentStep = step === "review" ? TOTAL_STEPS + 1 : parseInt(step, 10);

  // Parse location data - handle both JSON and legacy string formats
  let addressData = { street: "", city: "", landmarks: "" };
  if (business?.address) {
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
      // Legacy format: plain string
      addressData = { street: business.address, city: "", landmarks: "" };
    }
  }

  return (
    <OnboardingWizard
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      initialData={{
        name: business?.name ?? "",
        opening_hours: (business?.opening_hours as Record<
          string,
          { open?: string; close?: string; closed?: boolean }
        >) ?? {},
        address: addressData.street,
        city: addressData.city,
        landmarks: addressData.landmarks,
        phone: business?.phone ?? "",
      }}
    />
  );
}

// Generate static params for the valid steps
export function generateStaticParams() {
  return VALID_STEPS.map((step) => ({ step }));
}
