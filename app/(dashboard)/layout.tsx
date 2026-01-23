import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardData } from "@/actions/dashboard";

export const metadata = {
  title: "Dashboard",
};

async function DashboardHeaderWrapper() {
  const result = await getDashboardData();

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED" || result.error.code === "FORBIDDEN") {
      redirect("/auth/login");
    }
    return (
      <DashboardHeader businessName="My Business" botActive={true} />
    );
  }

  return (
    <DashboardHeader
      businessName={result.data.businessName}
      botActive={result.data.botActive}
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
      <BottomNavigation />
    </div>
  );
}
