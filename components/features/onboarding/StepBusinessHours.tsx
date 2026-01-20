"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { NavigationButtons } from "./NavigationButtons";
import { DayHoursRow } from "./DayHoursRow";
import { useOnboarding } from "./OnboardingContext";
import { saveBusinessHours } from "@/actions/onboarding";
import {
  businessHoursSchema,
  defaultBusinessHours,
  DAYS_OF_WEEK,
  type BusinessHoursInput,
} from "@/lib/validations/onboarding";

/**
 * StepBusinessHours Component
 *
 * Step 2 of onboarding: Collects business operating hours.
 * Allows setting open/close times for each day of the week.
 */
export function StepBusinessHours() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { data, updateData } = useOnboarding();

  const form = useForm<BusinessHoursInput>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: {
      opening_hours:
        data.opening_hours && Object.keys(data.opening_hours).length > 0
          ? (data.opening_hours as BusinessHoursInput["opening_hours"])
          : defaultBusinessHours,
    },
  });

  const onSubmit = async (values: BusinessHoursInput) => {
    try {
      const result = await saveBusinessHours(values);

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      // Update context and navigate
      updateData("opening_hours", values.opening_hours);
      // If returnTo=review, go back to review step
      const nextPath = returnTo === "review" ? "/onboarding/review" : `/onboarding/${result.data.nextStep}`;
      router.push(nextPath);
    } catch (error) {
      console.error("[ERROR] [ONBOARDING] Step 2 submit failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const applyToAllWeekdays = () => {
    const mondayHours = form.getValues("opening_hours.monday");
    const weekdays = ["tuesday", "wednesday", "thursday", "friday"] as const;

    weekdays.forEach((day) => {
      form.setValue(`opening_hours.${day}`, { ...mondayHours });
    });

    toast.success("Applied Monday hours to all weekdays");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Set your business hours for each day. Toggle the switch to mark a day
          as closed.
        </div>

        <div className="space-y-1">
          {DAYS_OF_WEEK.map((day) => (
            <DayHoursRow key={day} day={day} />
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyToAllWeekdays}
          >
            Apply Monday hours to weekdays
          </Button>
        </div>

        <NavigationButtons
          currentStep={2}
          isSubmitting={form.formState.isSubmitting}
          isValid={form.formState.isValid}
        />
      </form>
    </Form>
  );
}
