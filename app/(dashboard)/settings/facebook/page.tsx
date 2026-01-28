import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptCookieData } from "@/lib/encryption";
import { FacebookPageSelectorWrapper } from "@/components/features/settings/FacebookPageSelectorWrapper";
import { FacebookConnectionCard } from "@/components/features/settings/FacebookConnectionCard";
import { getFacebookStatus } from "@/actions/facebook";
import type { PendingFacebookPages } from "@/types";

export const metadata = {
  title: "Facebook Page",
};

/**
 * Facebook Settings Page
 *
 * Handles two scenarios:
 * 1. OAuth flow in progress: Show Page selection
 * 2. Normal view: Show connection status
 */
export default async function FacebookSettingsPage() {
  // Check for pending pages from OAuth flow
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get("facebook_pending_pages")?.value;

  if (pendingCookie) {
    try {
      // Decrypt the cookie data
      const pendingPages = decryptCookieData<PendingFacebookPages>(pendingCookie);

      // Check if not expired
      if (Date.now() < pendingPages.expiresAt && pendingPages.pages.length > 0) {
        return (
          <div className="container max-w-lg mx-auto px-4 py-6">
            <FacebookPageSelectorWrapper pages={pendingPages.pages} />
          </div>
        );
      }
    } catch {
      // Invalid or tampered cookie, fall through to normal view
    }
  }

  // No pending pages - show connection status
  const statusResult = await getFacebookStatus();

  if (!statusResult.success) {
    // Redirect to settings if unauthorized
    redirect("/settings?error=unauthorized");
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Facebook Page</h1>
      <FacebookConnectionCard status={statusResult.data} />
    </div>
  );
}
