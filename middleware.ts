import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authConfig from "./auth.config";

/* Edge-runtime middleware. Uses a slim NextAuth instance built from
 * the shared auth.config so this file never bundles Node-only modules
 * (Resend, node:crypto via the events hooks in auth.ts). The JWT
 * cookie format is identical between this instance and the full one,
 * so session decoding here Just Works.
 *
 * Three responsibilities, executed in order on every matched request:
 *
 *  1. Forward the request pathname as `x-pathname` so app/layout.tsx
 *     can conditionally apply an inline dark background on the
 *     homepage's <html> element at first paint. Inline html style is
 *     the only mechanism that paints the canvas before CSS loads;
 *     reading the path requires `headers()` in the layout, which
 *     forces dynamic rendering of every route through it.
 *
 *  2. Gate /admin/* on a valid admin session. Auth comes from the
 *     Auth.js v5 JWT cookie; the wrapper attaches the session to
 *     req.auth. Non-authenticated requests redirect to /signin with
 *     the original path preserved as callbackUrl. Authenticated-but-
 *     not-admin requests redirect to /signin with error=AccessDenied.
 *     The signIn callback in auth.config.ts also enforces the
 *     allowlist at OAuth callback time, so this is a defense-in-depth
 *     check rather than the only one.
 *
 *  3. Mitigate the dynamic-rendering cost by setting a CDN cache
 *     header on marketing routes. Vercel's edge cache will serve
 *     cached HTML to subsequent visitors for an hour, giving sub-50ms
 *     TTFB on cache hits. Pathlight, API, admin, and signin routes
 *     are excluded because those are user-specific or auth-gated and
 *     must not be cached at the CDN.
 */

const { auth: middlewareAuth } = NextAuth(authConfig);

const CACHE_EXCLUDED_PREFIXES = [
  "/api",
  "/pathlight",
  "/monitoring",
  "/admin",
  "/portal",
  "/signin",
  "/invite",
];

const ADMIN_PREFIXES = ["/admin"];
const PORTAL_PREFIXES = ["/portal"];

function shouldCachePathname(pathname: string): boolean {
  return !CACHE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/* Strict prefix match: a path matches `base` only when it equals
 * `base` exactly or extends it via a `/` separator. Without this,
 * `pathname.startsWith("/portal")` would also swallow `/portal-access`
 * (the public client entry) into the protected portal namespace and
 * redirect unauthenticated visitors to the admin sign-in page. */
function isPathOrSubpath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

export default middlewareAuth((request: NextRequest & { auth: import("next-auth").Session | null }) => {
  const { pathname, search } = request.nextUrl;
  const isAdminPath = ADMIN_PREFIXES.some((p) => isPathOrSubpath(pathname, p));
  const isPortalPath = PORTAL_PREFIXES.some((p) => isPathOrSubpath(pathname, p));

  if (isAdminPath || isPortalPath) {
    const session = request.auth;
    const role = session?.user?.role;

    if (!session || !role) {
      /* Admin paths bounce to /signin (Studio admin entry). Portal
       * paths bounce to /portal-access (public client entry). */
      const entry = isAdminPath ? "/signin" : "/portal-access";
      const signInUrl = new URL(entry, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(signInUrl);
    }

    /* Admins can access /portal too (preview client view). Clients
     * cannot access /admin. Anyone else with a session somehow lacking
     * a role gets bounced. */
    if (isAdminPath && role !== "admin") {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname + search);
      signInUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(signInUrl);
    }
    if (isPortalPath && role !== "admin" && role !== "client") {
      const signInUrl = new URL("/portal-access", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname + search);
      signInUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(signInUrl);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (shouldCachePathname(pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return response;
});

export const config = {
  /* Skip Next-internal asset routes and the Auth.js handler itself.
     The Auth.js callback POST/GET handlers must not pass through the
     wrapper, since `auth()` would recurse. /api/auth is unguarded by design. */
  matcher: [
    "/((?!_next/static|_next/image|api/auth|favicon.ico|brand|images|robots.txt|sitemap.xml|manifest.webmanifest|monitoring).*)",
  ],
};
