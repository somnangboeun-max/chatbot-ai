import { redirect } from "next/navigation";

/**
 * Onboarding Entry Point
 *
 * Redirects to the first step of the onboarding wizard.
 * This ensures users always start at step 1 when accessing /onboarding directly.
 */
export default function OnboardingPage() {
  redirect("/onboarding/1");
}
