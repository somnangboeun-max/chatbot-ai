"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NavigationButtons } from "./NavigationButtons";
import { useOnboarding } from "./OnboardingContext";
import { saveBusinessName } from "@/actions/onboarding";
import {
  businessNameSchema,
  type BusinessNameInput,
} from "@/lib/validations/onboarding";

/**
 * StepBusinessName Component
 *
 * Step 1 of onboarding: Collects the business name.
 * Validates with Zod schema and saves to database.
 */
export function StepBusinessName() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const form = useForm<BusinessNameInput>({
    resolver: zodResolver(businessNameSchema),
    defaultValues: {
      name: data.name ?? "",
    },
  });

  const onSubmit = async (values: BusinessNameInput) => {
    try {
      const result = await saveBusinessName(values);

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      // Update context and navigate
      updateData("name", values.name);
      router.push(`/onboarding/${result.data.nextStep}`);
    } catch (error) {
      console.error("[ERROR] [ONBOARDING] Step 1 submit failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Sokha's Noodle House"
                  maxLength={100}
                  className="min-h-[44px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {field.value?.length ?? 0}/100 characters
              </p>
            </FormItem>
          )}
        />

        <NavigationButtons
          currentStep={1}
          isSubmitting={form.formState.isSubmitting}
          isValid={form.formState.isValid}
        />
      </form>
    </Form>
  );
}
