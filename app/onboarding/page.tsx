import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";

/**
 * Onboarding Page (Placeholder)
 *
 * This is a placeholder page for the onboarding wizard.
 * Full implementation comes in Epic 2: Business Onboarding & Configuration.
 *
 * For now, it displays a message and the user's business info.
 */

async function OnboardingContent() {
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
    .select("name, onboarding_completed")
    .eq("id", tenantId)
    .single();

  // If onboarding is already complete, redirect to dashboard
  if (business?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Welcome, {business?.name || "Business Owner"}!
          </CardTitle>
          <CardDescription>
            Let&apos;s set up your chatbot for your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Coming Soon:</strong> The onboarding wizard will guide you
              through:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Setting up your business profile</li>
              <li>Adding your products and prices</li>
              <li>Configuring automated responses</li>
              <li>Connecting your Facebook page</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            This feature will be available in Epic 2. For now, your account is
            ready and your business has been created.
          </p>

          <div className="p-3 bg-primary/10 rounded-md">
            <p className="text-sm">
              <strong>Business ID:</strong>{" "}
              <code className="text-xs">{tenantId}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-12 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingContent />
    </Suspense>
  );
}
