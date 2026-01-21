import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NotificationSettings } from "@/components/features/settings/NotificationSettings";
import type { NotificationMethod } from "@/lib/validations/notification";

export const metadata = {
  title: "Notifications - Settings",
};

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    redirect("/auth/login");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("notification_method, notification_target")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("[ERROR] [NOTIFICATIONS] Fetch failed:", {
      tenantId,
      error: error.message,
    });
  }

  // Map database values to component props
  // Database stores null for 'none', but component expects 'none' string
  const currentMethod: NotificationMethod =
    (business?.notification_method as NotificationMethod) || "none";

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back Navigation */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2">
            <ChevronLeft className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how you receive alerts when the bot needs your help.
        </p>
      </div>

      <NotificationSettings
        currentMethod={currentMethod}
        currentTarget={business?.notification_target || null}
      />
    </div>
  );
}
