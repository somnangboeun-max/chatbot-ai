import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Skeleton className="h-8 w-32 mb-6" />

      {/* Hero card skeleton */}
      <Card className="mb-6">
        <CardContent className="py-8">
          <Skeleton className="h-12 w-24 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </CardContent>
      </Card>

      {/* Attention items skeleton */}
      <Skeleton className="h-6 w-36 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
