import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionRole } from "@/lib/canopy/rbac";
import { upsertOAuthToken } from "@/lib/canopy/email/oauth-tokens";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  isGoogleOAuthConfigured,
  OAUTH_STATE_COOKIE,
} from "@/lib/integrations/google-oauth";
import { recordChange } from "@/lib/canopy/audit";

/* Phase 4: completes the Google OAuth handshake. Validates the state
 * cookie set by /start, exchanges the authorization code, fetches the
 * connected Gmail address, encrypts and stores both tokens, and
 * redirects back to /admin/canopy with a success flag.
 *
 * Errors land back at /admin/canopy with ?google=error&reason=... so
 * the operator sees a clear failure surface instead of a raw 500. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectToCanopy(reqUrl: string, params: Record<string, string>): NextResponse {
  const url = new URL("/admin/canopy", reqUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const session = await getSessionRole();
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (!isGoogleOAuthConfigured()) {
    return redirectToCanopy(req.url, {
      google: "error",
      reason: "not_configured",
    });
  }

  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const errorParam = incoming.searchParams.get("error");

  if (errorParam) {
    return redirectToCanopy(req.url, {
      google: "error",
      reason: errorParam,
    });
  }
  if (!code || !state) {
    return redirectToCanopy(req.url, {
      google: "error",
      reason: "missing_code_or_state",
    });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) {
    return redirectToCanopy(req.url, {
      google: "error",
      reason: "state_mismatch",
    });
  }

  try {
    const exchange = await exchangeCodeForTokens(code);
    const userInfo = await fetchUserInfo(exchange.accessToken);
    const expiresAt = new Date(Date.now() + exchange.expiresInSeconds * 1000);

    await upsertOAuthToken({
      userEmail: session.email,
      provider: "google",
      connectedEmail: userInfo.email,
      scopes: exchange.scope,
      accessToken: exchange.accessToken,
      refreshToken: exchange.refreshToken,
      accessTokenExpiresAt: expiresAt,
    });

    await recordChange({
      entityType: "oauth_tokens",
      entityId: session.email,
      action: "integration.google.connected",
      after: {
        connectedEmail: userInfo.email,
        scopes: exchange.scope,
      },
      metadata: { provider: "google" },
    });

    return redirectToCanopy(req.url, {
      google: "connected",
      email: userInfo.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return redirectToCanopy(req.url, {
      google: "error",
      reason: "exchange_failed",
      message: message.slice(0, 120),
    });
  }
}
