import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard";
import { getProducts } from "@/actions/onboarding";

const VALID_STEPS = ["1", "2", "3", "4", "5", "review"];
const TOTAL_STEPS = 5;

interface OnboardingStepPageProps {
  params: Promise<{ step: string }>;
}

/**
 * Dynamic Onboarding Step Page
 *
 * Handles routing for each step of the onboarding wizard.
 * Steps 1-5 are implemented:
 *   1. Business Name
 *   2. Business Hours
 *   3. Location
 *   4. Contact Phone
 *   5. Products & Prices
 *
 * Review step is implemented in Story 2.3.
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

  // Fetch products for step 5 and review
  let productsData: Array<{
    id: string;
    name: string;
    price: number;
    currency: "USD" | "KHR";
  }> = [];
  if (step === "5" || step === "review") {
    const productsResult = await getProducts();
    if (productsResult.success) {
      productsData = productsResult.data.map((p) => ({
        id: p.id ?? "",
        name: p.name,
        price: p.price,
        currency: p.currency,
      }));
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
        products: productsData,
      }}
    />
  );
}

// Generate static params for the valid steps
export function generateStaticParams() {
  return VALID_STEPS.map((step) => ({ step }));
}
