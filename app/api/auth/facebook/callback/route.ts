/**
 * Facebook OAuth Callback Route Handler
 * Story 4.1: Facebook Page Connection Flow
 *
 * GET /api/auth/facebook/callback
 * Handles OAuth callback, exchanges code for token, fetches Pages
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { encryptCookieData } from "@/lib/encryption";
import { exchangeCodeForToken, fetchUserPages } from "@/lib/facebook/client";
import type { PendingFacebookPages } from "@/types";

// Cookie time-to-live in seconds (5 minutes)
const PENDING_PAGES_TTL_SECONDS = 300;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const redirectUri = env.FACEBOOK_OAUTH_REDIRECT_URI;

  // Handle user denial
  if (error) {
    console.info("[INFO] [OAUTH] User denied Facebook permission:", { error });
    return NextResponse.redirect(
      new URL("/settings?error=facebook_denied", baseUrl)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("[ERROR] [OAUTH] Missing code or state");
    return NextResponse.redirect(
      new URL("/settings?error=invalid_state", baseUrl)
    );
  }

  // Verify CSRF state token
  const cookieStore = await cookies();
  const storedState = cookieStore.get("facebook_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    console.error("[ERROR] [OAUTH] Invalid state token:", {
      hasStoredState: !!storedState,
      statesMatch: storedState === state,
    });
    return NextResponse.redirect(
      new URL("/settings?error=invalid_state", baseUrl)
    );
  }

  // Clear the state cookie
  cookieStore.delete("facebook_oauth_state");

  try {
    // Exchange code for user access token
    if (!redirectUri) {
      throw new Error("OAuth redirect URI not configured");
    }

    const userToken = await exchangeCodeForToken(code, redirectUri);

    // Fetch user's managed Pages
    const pages = await fetchUserPages(userToken);

    if (pages.length === 0) {
      console.info("[INFO] [OAUTH] No Pages found for user");
      return NextResponse.redirect(
        new URL("/settings?error=no_pages", baseUrl)
      );
    }

    // Store Pages in encrypted short-lived httpOnly cookie (5 min expiry)
    const pendingPages: PendingFacebookPages = {
      pages,
      expiresAt: Date.now() + PENDING_PAGES_TTL_SECONDS * 1000,
    };

    // Encrypt the cookie data to protect access tokens
    const encryptedData = encryptCookieData(pendingPages);

    cookieStore.set("facebook_pending_pages", encryptedData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PENDING_PAGES_TTL_SECONDS,
      path: "/",
    });

    console.info("[INFO] [OAUTH] Pages stored, redirecting to selection:", {
      pageCount: pages.length,
    });

    // Redirect to Page selection
    return NextResponse.redirect(
      new URL("/settings/facebook", baseUrl)
    );
  } catch (err) {
    console.error("[ERROR] [OAUTH] OAuth flow failed:", err);
    return NextResponse.redirect(
      new URL("/settings?error=facebook_error", baseUrl)
    );
  }
}
