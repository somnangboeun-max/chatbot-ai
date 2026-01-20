"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NavigationButtons } from "./NavigationButtons";
import { useOnboarding } from "./OnboardingContext";
import { saveContact } from "@/actions/onboarding";
import { contactSchema, type ContactInput } from "@/lib/validations/onboarding";

/**
 * StepContact Component
 *
 * Step 4 of onboarding: Collects business contact phone number.
 * Validates Cambodian phone number formats.
 */
export function StepContact() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { data, updateData } = useOnboarding();

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phone: data.phone ?? "",
    },
  });

  const onSubmit = async (values: ContactInput) => {
    try {
      const result = await saveContact(values);

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      // Update context and navigate to products step (Story 2.2)
      updateData("phone", values.phone);
      // If returnTo=review, go back to review step
      const nextPath = returnTo === "review" ? "/onboarding/review" : `/onboarding/${result.data.nextStep}`;
      router.push(nextPath);
    } catch (error) {
      console.error("[ERROR] [ONBOARDING] Step 4 submit failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="012 345 678"
                  className="min-h-[44px] text-lg tracking-wider"
                  {...field}
                  onChange={(e) => {
                    // Allow only digits and common phone characters
                    const value = e.target.value.replace(/[^\d+\s-]/g, "");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Cambodian mobile number (e.g., 012345678, 0961234567)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Accepted Formats</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Mobile: 012, 015, 016, 017, 069, 070-099</li>
            <li>With country code: +855 12 345 678</li>
            <li>Without prefix: 12 345 678</li>
          </ul>
        </div>

        <NavigationButtons
          currentStep={4}
          isSubmitting={form.formState.isSubmitting}
          isValid={form.formState.isValid}
          submitLabel="Continue to Products"
        />
      </form>
    </Form>
  );
}
