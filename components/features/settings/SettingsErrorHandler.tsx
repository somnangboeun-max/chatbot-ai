"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  facebook_denied: "Facebook connection was cancelled",
  invalid_state: "Invalid request. Please try again.",
  no_pages: "No Facebook Pages found. Create a Page first.",
  facebook_error: "Connection failed. Please try again.",
  facebook_not_configured: "Facebook integration is not configured.",
  unauthorized: "Please log in to access this page.",
};

/**
 * SettingsErrorHandler Component
 *
 * Handles error query params and shows toast notifications.
 * Clears the error param after showing the toast.
 */
export function SettingsErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const message = ERROR_MESSAGES[error] || "An error occurred";
      toast.error(message);

      // Clear the error param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
