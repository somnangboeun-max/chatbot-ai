"use client";

import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * ProgressDots Component
 *
 * Visual progress indicator showing the current step in the onboarding wizard.
 * Displays dots for each step, with the current step highlighted and expanded.
 */
export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isCurrentStep = stepNumber === currentStep;
        const isCompletedStep = stepNumber < currentStep;

        return (
          <div
            key={stepNumber}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              isCurrentStep
                ? "bg-primary w-6"
                : isCompletedStep
                  ? "bg-primary w-2"
                  : "bg-muted w-2"
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
