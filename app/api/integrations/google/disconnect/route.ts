import { NextResponse } from "next/server";
import { getSessionRole } from "@/lib/canopy/rbac";
import {
  deleteOAuthToken,
  getOAuthTokenForUser,
} from "@/lib/canopy/email/oauth-tokens";
import { revokeToken } from "@/lib/integrations/google-oauth";
import { recordChange } from "@/lib/canopy/audit";

/* Phase 4: revokes the connected Google account for the signed-in
 * admin. Best-effort revocation at Google (we still delete the local
 * row even if Google's revoke endpoint 5xx's; the operator can always
 * remove our app at myaccount.google.com manually). Form POST so this
 * works from a plain <button form="..." formAction="..."> without
 * client-side JS. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectToCanopy(reqUrl: string, params: Record<string, string>): NextResponse {
  const url = new URL("/admin/canopy", reqUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session) {
    return NextResponse.redirect(new URL("/signin", req.url), { status: 303 });
  }

  const stored = await getOAuthTokenForUser(session.email).catch(() => null);
  if (stored?.refreshToken) {
    /* Revoke the refresh token (Google will invalidate the access token
     * automatically). Failure is logged but not fatal; the local row is
     * still removed so the operator can immediately reconnect. */
    try {
      await revokeToken(stored.refreshToken);
    } catch (err) {
      console.warn(
        "[oauth-disconnect] Google revoke failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  await deleteOAuthToken(session.email);

  await recordChange({
    entityType: "oauth_tokens",
    entityId: session.email,
    action: "integration.google.disconnected",
    before: stored
      ? { connectedEmail: stored.connectedEmail, scopes: stored.scopes }
      : null,
    metadata: { provider: "google" },
  });

  return redirectToCanopy(req.url, { google: "disconnected" });
}
