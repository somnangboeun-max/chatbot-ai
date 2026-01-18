import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/features/auth/SignOutButton";
import { Suspense } from "react";

/**
 * Dashboard Page (Placeholder)
 *
 * This is a placeholder page for the main dashboard.
 * Full implementation comes in Epic 3: Owner Dashboard & Bot Control.
 *
 * For now, it displays basic business info and a sign out button.
 */

async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const tenantId = user.app_metadata?.tenant_id;

  if (!tenantId) {
    redirect("/auth/setup-business");
  }

  // Fetch business info
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", tenantId)
    .single();

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {business?.name || "Business Owner"}
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Business Info</CardTitle>
              <CardDescription>Your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-medium">{business?.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bot Status</p>
                <p className="font-medium">
                  {business?.bot_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-yellow-600">Paused</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Onboarding</p>
                <p className="font-medium">
                  {business?.onboarding_completed ? (
                    <span className="text-green-600">Complete</span>
                  ) : (
                    <span className="text-yellow-600">Incomplete</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Features in development</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Message statistics and analytics</li>
                <li>Bot pause/resume control</li>
                <li>Conversation management</li>
                <li>Facebook Messenger integration</li>
                <li>Staff notifications</li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Full dashboard features will be implemented in Epic 3.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <code className="text-xs">{user.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant ID</span>
              <code className="text-xs">{tenantId}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>
                {business?.created_at
                  ? new Date(business.created_at).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
