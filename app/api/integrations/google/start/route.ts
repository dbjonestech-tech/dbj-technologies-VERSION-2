import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionRole } from "@/lib/canopy/rbac";
import {
  buildAuthorizeUrl,
  generateOAuthState,
  isGoogleOAuthConfigured,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
} from "@/lib/integrations/google-oauth";

/* Phase 4: kicks off the Google OAuth handshake for the signed-in
 * admin. Generates a CSRF state, stores it in an HttpOnly Secure
 * cookie, and 302-redirects to Google's authorize URL. The matching
 * /callback route validates the cookie before exchanging the code. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSessionRole();
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in Vercel.",
      },
      { status: 500 }
    );
  }

  const state = generateOAuthState();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });

  const authorizeUrl = buildAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
