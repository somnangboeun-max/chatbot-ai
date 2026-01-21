import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NotificationsLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="mb-4">
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-11 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
