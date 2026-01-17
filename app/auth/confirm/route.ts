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
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      console.info("[INFO] [AUTH] Email verified successfully");
      // Redirect to login with success message as per AC #4
      // If next is provided, append success message; otherwise use default login URL
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
      console.error("[ERROR] [AUTH] Email verification failed:", error.message);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  console.error("[ERROR] [AUTH] Email verification failed: Missing token_hash or type");
  redirect("/auth/error?error=Could not verify email. Invalid or missing verification link.");
}
