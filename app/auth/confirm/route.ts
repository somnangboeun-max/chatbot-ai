import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (token_hash && type) {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        // Handle different verification types
        if (type === "recovery") {
          console.info("[INFO] [AUTH] Password recovery token verified");
          // For password recovery, redirect to update password page
          redirect("/auth/update-password");
        }

        console.info("[INFO] [AUTH] Email verified successfully");
        // For email confirmation, redirect to login with success message
        const successMessage = "Email verified! You can now log in.";
        let redirectUrl: string;
        if (next) {
          const nextUrl = new URL(next, request.url);
          nextUrl.searchParams.set("message", successMessage);
          redirectUrl = nextUrl.pathname + nextUrl.search;
        } else {
          redirectUrl = `/auth/login?message=${encodeURIComponent(successMessage)}`;
        }
        redirect(redirectUrl);
      } else {
        console.error(
          "[ERROR] [AUTH] Token verification failed:",
          error.message
        );

        // For password recovery, redirect to update-password with error
        if (type === "recovery") {
          redirect(
            `/auth/update-password?error=access_denied&error_description=${encodeURIComponent("This reset link has expired")}`
          );
        }

        // For other types, redirect to error page
        redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
      }
    } catch (err) {
      // Handle unexpected errors (network issues, service unavailable, etc.)
      // Note: redirect() throws a special error that should be re-thrown
      const error = err as { digest?: string };
      if (error.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("[ERROR] [AUTH] Unexpected error during token verification:", err);

      // For password recovery, provide specific error handling
      if (type === "recovery") {
        redirect(
          `/auth/update-password?error=access_denied&error_description=${encodeURIComponent("Unable to verify reset link. Please try again.")}`
        );
      }

      redirect("/auth/error?error=An unexpected error occurred. Please try again.");
    }
  }

  console.error(
    "[ERROR] [AUTH] Token verification failed: Missing token_hash or type"
  );
  redirect(
    "/auth/error?error=Could not verify email. Invalid or missing verification link."
  );
}
