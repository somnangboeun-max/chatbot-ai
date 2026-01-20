import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ProductList, AddProductForm } from "@/components/features/settings";

export const metadata = {
  title: "Products & Prices - Settings",
};

export default async function ProductsSettingsPage() {
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

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, currency, is_active, created_at, updated_at, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ERROR] [PRODUCTS] Fetch failed:", {
      tenantId,
      error: error.message,
    });
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Products & Prices</h1>
        <p className="text-muted-foreground">
          Manage your product catalog. Changes are used by the bot immediately.
        </p>
      </div>

      <div className="space-y-4">
        <AddProductForm />
        <ProductList products={products || []} />
      </div>
    </div>
  );
}
