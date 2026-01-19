"use client";

import type { ReactNode } from "react";
import { NavigationButtons } from "./NavigationButtons";

interface StepContainerProps {
  children: ReactNode;
  currentStep: number;
  isSubmitting?: boolean;
  isValid?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
}

/**
 * StepContainer Component
 *
 * Consistent layout wrapper for each onboarding step.
 * Includes the form content and navigation buttons.
 */
export function StepContainer({
  children,
  currentStep,
  isSubmitting = false,
  isValid = true,
  onSubmit,
  submitLabel,
}: StepContainerProps) {
  return (
    <div className="space-y-6">
      {children}
      <NavigationButtons
        currentStep={currentStep}
        isSubmitting={isSubmitting}
        isValid={isValid}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
      />
    </div>
  );
}
