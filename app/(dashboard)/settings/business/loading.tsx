import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessSettingsLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="space-y-6">
        {/* Business Name Card */}
        <Card>
          <CardHeader className="py-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>

        {/* Business Hours Card */}
        <Card>
          <CardHeader className="py-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-10 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader className="py-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-11 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Phone Card */}
        <Card>
          <CardHeader className="py-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
