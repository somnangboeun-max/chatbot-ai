import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for onboarding pages
 */
export default function OnboardingLoading() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        {/* Progress dots skeleton */}
        <div className="flex items-center justify-center gap-2 py-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full" />
          ))}
        </div>
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="flex justify-between pt-4">
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
