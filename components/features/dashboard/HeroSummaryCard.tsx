import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatDisplay } from "./StatDisplay";
import type { DashboardStats } from "@/types/dashboard";

interface HeroSummaryCardProps {
  stats: DashboardStats;
}

export function HeroSummaryCard({ stats }: HeroSummaryCardProps) {
  if (stats.messagesHandledToday === 0 && stats.messagesHandledThisWeek === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg text-muted-foreground">
            Ready to help your customers!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your Facebook Page to start receiving messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">
        {stats.hasOvernightMessages && (
          <p className="text-sm text-muted-foreground mb-2">
            While you slept...
          </p>
        )}
        <StatDisplay
          value={
            stats.hasOvernightMessages
              ? stats.overnightMessages
              : stats.messagesHandledToday
          }
          label={
            stats.hasOvernightMessages
              ? "messages handled overnight"
              : "messages handled today"
          }
          variant="large"
        />
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <StatDisplay
            value={stats.ordersCaptured}
            label="orders captured"
            variant="medium"
          />
          <StatDisplay
            value={stats.attentionNeeded}
            label="need attention"
            variant="medium"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function HeroSummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="py-6">
        <Skeleton className="h-10 w-20 mb-2" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
