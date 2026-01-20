"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressDots } from "./ProgressDots";
import { OnboardingProvider, type OnboardingData } from "./OnboardingContext";
import { StepBusinessName } from "./StepBusinessName";
import { StepBusinessHours } from "./StepBusinessHours";
import { StepLocation } from "./StepLocation";
import { StepContact } from "./StepContact";
import { StepProducts } from "./StepProducts";
import { StepReview } from "./StepReview";

interface OnboardingWizardProps {
  currentStep: number;
  totalSteps: number;
  initialData: Partial<OnboardingData>;
}

const STEP_TITLES: Record<number, string> = {
  1: "Business Name",
  2: "Business Hours",
  3: "Location",
  4: "Contact Phone",
  5: "Products & Prices",
  6: "Review & Complete",
};

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "What is your business called?",
  2: "When is your business open?",
  3: "Where is your business located?",
  4: "How can customers reach you?",
  5: "What products or services do you offer?",
  6: "Review your information before completing setup",
};

/**
 * OnboardingWizard Component
 *
 * Main wrapper component for the multi-step onboarding wizard.
 * Handles step rendering and context provider setup.
 */
export function OnboardingWizard({
  currentStep,
  totalSteps,
  initialData,
}: OnboardingWizardProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBusinessName />;
      case 2:
        return <StepBusinessHours />;
      case 3:
        return <StepLocation />;
      case 4:
        return <StepContact />;
      case 5:
        return <StepProducts />;
      case 6:
        return <StepReview />;
      default:
        return null;
    }
  };

  return (
    <OnboardingProvider initialData={initialData}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <ProgressDots currentStep={currentStep} totalSteps={totalSteps} />
          <CardTitle className="text-2xl font-semibold">
            {STEP_TITLES[currentStep]}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {STEP_DESCRIPTIONS[currentStep]}
          </p>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </OnboardingProvider>
  );
}
