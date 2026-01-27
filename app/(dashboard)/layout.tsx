import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardHeaderClient } from "@/components/layout/DashboardHeaderClient";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { BottomNavigationWrapper } from "@/components/layout/BottomNavigationWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardDataCached } from "@/lib/queries/dashboard";
import { getDashboardStats } from "@/actions/dashboard";

export const metadata = {
  title: "Dashboard",
};

async function DashboardHeaderWrapper() {
  const result = await getDashboardDataCached();

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED" || result.error.code === "FORBIDDEN") {
      redirect("/auth/login");
    }
    return (
      <DashboardHeaderClient
        businessName="My Business"
        initialBotActive={true}
        tenantId=""
      />
    );
  }

  return (
    <DashboardHeaderClient
      businessName={result.data.businessName}
      initialBotActive={result.data.botActive}
      tenantId={result.data.tenantId}
    />
  );
}

function HeaderSkeleton() {
  return (
    <header
      className="sticky top-0 z-40 bg-background border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </header>
  );
}

async function BottomNavigationContainer() {
  const statsResult = await getDashboardStats();

  if (!statsResult.success) {
    return <BottomNavigation messagesCount={0} />;
  }

  return (
    <BottomNavigationWrapper
      initialCount={statsResult.data.stats.attentionNeeded}
      tenantId={statsResult.data.tenantId}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeaderWrapper />
      </Suspense>
      <main className="flex-1 pb-14">{children}</main>
      <Suspense fallback={<BottomNavigation />}>
        <BottomNavigationContainer />
      </Suspense>
    </div>
  );
}
