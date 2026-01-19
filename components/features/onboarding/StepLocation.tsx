"use client";

import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { NavigationButtons } from "./NavigationButtons";
import { useOnboarding } from "./OnboardingContext";
import { saveLocation } from "@/actions/onboarding";
import {
  locationSchema,
  type LocationInput,
} from "@/lib/validations/onboarding";

/**
 * StepLocation Component
 *
 * Step 3 of onboarding: Collects business location/address.
 * Supports Khmer script input for addresses.
 */
export function StepLocation() {
  const router = useRouter();
  const { data, updatePartialData } = useOnboarding();

  const form = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address: data.address ?? "",
      city: data.city ?? "",
      landmarks: data.landmarks ?? "",
    },
  });

  const onSubmit = async (values: LocationInput) => {
    try {
      const result = await saveLocation(values);

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      // Update context and navigate
      updatePartialData({
        address: values.address,
        city: values.city,
        landmarks: values.landmarks,
      });
      router.push(`/onboarding/${result.data.nextStep}`);
    } catch (error) {
      console.error("[ERROR] [ONBOARDING] Step 3 submit failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your street address or full address in Khmer"
                  className="min-h-[80px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                House number, street name, Sangkat (commune)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / District</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Phnom Penh, Siem Reap"
                  className="min-h-[44px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Khan (district) or province</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="landmarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Landmarks <span className="text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Near Central Market, Behind Olympic Stadium"
                  className="min-h-[44px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nearby landmarks to help customers find you
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <NavigationButtons
          currentStep={3}
          isSubmitting={form.formState.isSubmitting}
          isValid={form.formState.isValid}
        />
      </form>
    </Form>
  );
}
