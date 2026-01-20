import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your app very slow.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes check - these routes require authentication
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/protected") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/messages") ||
    request.nextUrl.pathname.startsWith("/settings");

  // Routes that require tenant_id (after business setup)
  const requiresTenantId =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/messages") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (isProtectedRoute && !user) {
    // Preserve the original URL for post-login redirect (including query params)
    const redirectUrl = new URL("/auth/login", request.url);
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set("redirectTo", originalPath);

    // Check if this might be a session expiry (user had cookies but they're invalid)
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.includes("auth-token") || c.name.includes("sb-"));
    if (hasAuthCookie) {
      redirectUrl.searchParams.set("message", "Your session has expired. Please sign in again.");
    }

    return NextResponse.redirect(redirectUrl);
  }

  // Check for tenant_id on routes that require it
  if (requiresTenantId && user) {
    const tenantId = user.app_metadata?.tenant_id;

    if (!tenantId) {
      // User exists but no business - redirect to setup
      console.warn("[WARN] [MIDDLEWARE] User has no tenant_id:", { userId: user.id });
      return NextResponse.redirect(new URL("/auth/setup-business", request.url));
    }

    // Check onboarding status for dashboard routes
    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
    if (isDashboardRoute) {
      // Fetch business to check onboarding status
      const { data: business } = await supabase
        .from("businesses")
        .select("onboarding_completed")
        .eq("id", tenantId)
        .single();

      if (business && !business.onboarding_completed) {
        // User hasn't completed onboarding - redirect to onboarding wizard
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  // Check if user is on onboarding but has already completed it
  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isCelebrationRoute = request.nextUrl.pathname === "/onboarding/celebration";
  if (isOnboardingRoute && user && !isCelebrationRoute) {
    const tenantId = user.app_metadata?.tenant_id;
    if (tenantId) {
      const { data: business } = await supabase
        .from("businesses")
        .select("onboarding_completed")
        .eq("id", tenantId)
        .single();

      if (business?.onboarding_completed) {
        // User has completed onboarding - redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Redirect authenticated users away from auth pages (except confirm and setup-business)
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isConfirmRoute = request.nextUrl.pathname.includes("/confirm");
  const isSetupBusinessRoute = request.nextUrl.pathname.includes("/setup-business");

  if (isAuthRoute && user && !isConfirmRoute && !isSetupBusinessRoute) {
    // Check if user has tenant_id and onboarding status to determine where to redirect
    const tenantId = user.app_metadata?.tenant_id;
    if (tenantId) {
      // User has a business, redirect to dashboard or onboarding based on status
      // Note: We redirect to root and let the page handle the logic
      return NextResponse.redirect(new URL("/", request.url));
    }
    // No tenant_id - let them access setup-business
    return NextResponse.redirect(new URL("/auth/setup-business", request.url));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
