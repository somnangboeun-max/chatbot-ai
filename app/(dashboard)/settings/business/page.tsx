import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BusinessInfoForm } from "@/components/features/settings/BusinessInfoForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Business Info - Settings",
};

export default async function BusinessSettingsPage() {
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
    .select("id, name, opening_hours, address, phone")
    .eq("id", tenantId)
    .single();

  if (error || !business) {
    redirect("/dashboard");
  }

  // Parse location data from JSON address field
  let locationData = { street: "", city: "", landmarks: "" };
  if (business.address) {
    try {
      const parsed = JSON.parse(business.address) as {
        street?: string;
        city?: string;
        landmarks?: string;
      };
      locationData = {
        street: parsed.street ?? "",
        city: parsed.city ?? "",
        landmarks: parsed.landmarks ?? "",
      };
    } catch {
      // Legacy format: plain string address
      locationData = { street: business.address, city: "", landmarks: "" };
    }
  }

  // Transform business data for the form
  const businessData = {
    id: business.id,
    name: business.name,
    opening_hours: business.opening_hours as Record<
      string,
      { open?: string; close?: string; closed?: boolean }
    > | null,
    address: locationData.street,
    city: locationData.city,
    landmarks: locationData.landmarks,
    phone: business.phone ?? "",
  };

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
        <h1 className="text-2xl font-bold">Business Info</h1>
        <p className="text-muted-foreground">
          Tap any field to edit. Changes save automatically.
        </p>
      </div>

      <BusinessInfoForm business={businessData} />
    </div>
  );
}
