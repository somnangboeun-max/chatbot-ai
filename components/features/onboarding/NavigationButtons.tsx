"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NavigationButtonsProps {
  currentStep: number;
  isSubmitting?: boolean;
  isValid?: boolean;
  onSubmit?: () => void;
  onBack?: () => void;
  submitLabel?: string;
}

/**
 * NavigationButtons Component
 *
 * Footer navigation for onboarding steps.
 * Provides Back and Continue/Submit buttons with proper state handling.
 */
export function NavigationButtons({
  currentStep,
  isSubmitting = false,
  isValid = true,
  onSubmit,
  onBack,
  submitLabel = "Continue",
}: NavigationButtonsProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (currentStep > 1) {
      router.push(`/onboarding/${currentStep - 1}`);
    }
  };

  return (
    <div className="flex justify-between pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={currentStep === 1 || isSubmitting}
        className="min-h-[44px] min-w-[100px]"
      >
        Back
      </Button>
      <Button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="min-h-[44px] min-w-[100px]"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
