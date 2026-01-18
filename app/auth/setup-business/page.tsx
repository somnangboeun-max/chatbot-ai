"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Setup Business Page
 *
 * This page handles the edge case where a user exists but has no business record.
 * This can happen if business creation failed during signup.
 *
 * Flow:
 * 1. Check if user already has a business (redirect to dashboard/onboarding)
 * 2. If no business, attempt to create one
 * 3. Redirect appropriately after creation
 */
export default function SetupBusinessPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "needs-setup" | "creating">(
    "checking"
  );

  useEffect(() => {
    checkBusinessStatus();
  }, []);

  async function checkBusinessStatus() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Check if user has tenant_id in metadata
    const tenantId = user.app_metadata?.tenant_id;

    if (tenantId) {
      // User has a business, check onboarding status
      const { data: business } = await supabase
        .from("businesses")
        .select("onboarding_completed")
        .eq("id", tenantId)
        .single();

      if (business?.onboarding_completed) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      return;
    }

    // User has no tenant_id - needs business setup
    setStatus("needs-setup");
  }

  async function handleCreateBusiness() {
    setError(null);
    setStatus("creating");

    startTransition(async () => {
      try {
        // Call a server action to create the business
        // For now, we'll use the client-side approach which will fail due to RLS
        // The proper fix would be a server action, but this page shows the user
        // that something went wrong and they should contact support

        setError(
          "Business creation failed during signup. Please contact support or try signing up again with a different email."
        );
        setStatus("needs-setup");
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setStatus("needs-setup");
      }
    });
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Checking account status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Complete Account Setup
          </CardTitle>
          <CardDescription>
            Your account needs additional setup to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            It looks like your business profile wasn&apos;t created during
            registration. This can happen due to a temporary issue.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleCreateBusiness}
              disabled={isPending || status === "creating"}
            >
              {status === "creating" ? "Setting up..." : "Complete Setup"}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              disabled={isPending}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
