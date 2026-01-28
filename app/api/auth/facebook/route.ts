/**
 * Facebook OAuth Start Route Handler
 * Story 4.1: Facebook Page Connection Flow
 *
 * GET /api/auth/facebook
 * Initiates Facebook OAuth flow with CSRF protection
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const FACEBOOK_OAUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const OAUTH_SCOPES = [
  "pages_messaging",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_show_list",
].join(",");

export async function GET(): Promise<NextResponse> {
  const appId = env.FACEBOOK_APP_ID;
  const redirectUri = env.FACEBOOK_OAUTH_REDIRECT_URI;

  if (!appId || !redirectUri) {
    console.error("[ERROR] [OAUTH] Facebook OAuth not configured");
    return NextResponse.redirect(
      new URL("/settings?error=facebook_not_configured", env.NEXT_PUBLIC_SITE_URL)
    );
  }

  // Generate CSRF state token
  const state = randomBytes(32).toString("hex");

  // Store state in httpOnly cookie (10 min expiry)
  const cookieStore = await cookies();
  cookieStore.set("facebook_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPES,
    state,
    response_type: "code",
  });

  const oauthUrl = `${FACEBOOK_OAUTH_URL}?${params}`;

  console.info("[INFO] [OAUTH] Redirecting to Facebook OAuth");
  return NextResponse.redirect(oauthUrl);
}
