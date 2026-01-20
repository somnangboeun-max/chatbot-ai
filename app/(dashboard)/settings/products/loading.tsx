import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductsLoading() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-9 w-32 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-md" />

        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-11 w-11" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
