import { Skeleton } from "@/components/ui/skeleton";

export function ConversationDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Customer message (left) */}
        <div className="flex gap-2 mb-3 justify-start">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="max-w-[75%]">
            <Skeleton className="h-16 w-48 rounded-2xl" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>

        {/* Bot message (right) */}
        <div className="flex gap-2 mb-3 justify-end">
          <div className="max-w-[75%] text-right">
            <Skeleton className="h-3 w-8 mb-1 ml-auto" />
            <Skeleton className="h-12 w-56 rounded-2xl" />
            <Skeleton className="h-3 w-16 mt-1 ml-auto" />
          </div>
        </div>

        {/* Customer message (left) */}
        <div className="flex gap-2 mb-3 justify-start">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="max-w-[75%]">
            <Skeleton className="h-10 w-40 rounded-2xl" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>

        {/* Owner message (right) */}
        <div className="flex gap-2 mb-3 justify-end">
          <div className="max-w-[75%] text-right">
            <Skeleton className="h-3 w-8 mb-1 ml-auto" />
            <Skeleton className="h-20 w-64 rounded-2xl" />
            <Skeleton className="h-3 w-16 mt-1 ml-auto" />
          </div>
        </div>

        {/* Customer message (left) */}
        <div className="flex gap-2 mb-3 justify-start">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="max-w-[75%]">
            <Skeleton className="h-14 w-52 rounded-2xl" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
