"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding, type DayHours } from "./OnboardingContext";
import { completeOnboarding } from "@/actions/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, DAYS_OF_WEEK, formatTime12Hour } from "@/lib/validations/onboarding";

/**
 * StepReview Component
 *
 * Displays a summary of all onboarding data for user review.
 * Allows editing each section before completing onboarding.
 */
export function StepReview() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [isPending, startTransition] = useTransition();

  const handleEdit = (step: number) => {
    router.push(`/onboarding/${step}?returnTo=review`);
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeOnboarding();
      if (result.success) {
        router.push("/onboarding/celebration");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Business Name Section */}
      <ReviewSection title="Business Name" onEdit={() => handleEdit(1)}>
        <p className="text-lg">{data.name || "Not set"}</p>
      </ReviewSection>

      {/* Business Hours Section */}
      <ReviewSection title="Business Hours" onEdit={() => handleEdit(2)}>
        <BusinessHoursDisplay hours={data.opening_hours || {}} />
      </ReviewSection>

      {/* Location Section */}
      <ReviewSection title="Location" onEdit={() => handleEdit(3)}>
        <p>{data.address || "Not set"}</p>
        {data.city && <p>{data.city}</p>}
        {data.landmarks && (
          <p className="text-muted-foreground">{data.landmarks}</p>
        )}
      </ReviewSection>

      {/* Phone Section */}
      <ReviewSection title="Contact Phone" onEdit={() => handleEdit(4)}>
        <p>{data.phone || "Not set"}</p>
      </ReviewSection>

      {/* Products Section */}
      <ReviewSection title="Products & Prices" onEdit={() => handleEdit(5)}>
        {data.products && data.products.length > 0 ? (
          <ul className="space-y-1">
            {data.products.map((product, i) => (
              <li key={product.id || i} className="flex justify-between">
                <span>{product.name}</span>
                <span className="font-medium">
                  {formatPrice(product.price, product.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No products added</p>
        )}
      </ReviewSection>

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={isPending}
        className="w-full min-h-[48px] text-lg"
      >
        {isPending ? "Activating..." : "Activate Bot"}
      </Button>
    </div>
  );
}

/**
 * ReviewSection Component
 *
 * Reusable section wrapper with edit button.
 * Touch target minimum 44px for accessibility.
 */
function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="min-h-[44px] min-w-[44px] p-0"
          aria-label={`Edit ${title}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

/**
 * BusinessHoursDisplay Component
 *
 * Displays business hours formatted by day with open/closed status.
 */
function BusinessHoursDisplay({ hours }: { hours: Record<string, DayHours> }) {
  const dayLabels: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  return (
    <div className="space-y-1 text-sm">
      {DAYS_OF_WEEK.map((day) => {
        const dayHours = hours[day];
        return (
          <div key={day} className="flex justify-between">
            <span>{dayLabels[day]}</span>
            <span>
              {dayHours?.closed
                ? "Closed"
                : dayHours?.open && dayHours?.close
                  ? `${formatTime12Hour(dayHours.open)} - ${formatTime12Hour(dayHours.close)}`
                  : "Not set"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
