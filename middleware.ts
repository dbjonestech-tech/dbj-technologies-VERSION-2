import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Two responsibilities:
 *
 *  1. Forward the request pathname as `x-pathname` so app/layout.tsx
 *     can conditionally apply an inline dark background on the
 *     homepage's <html> element at first paint. Inline html style is
 *     the only mechanism that paints the canvas before CSS loads;
 *     reading the path requires `headers()` in the layout, which
 *     forces dynamic rendering of every route through it.
 *
 *  2. Mitigate the dynamic-rendering cost by setting a CDN cache
 *     header on marketing routes. Vercel's edge cache will serve
 *     cached HTML to subsequent visitors for an hour, giving sub-50ms
 *     TTFB on cache hits. The first visitor pays the SSR cost; every
 *     visitor after them gets static-equivalent speed.
 *     Pathlight and API routes are excluded — those have user-specific
 *     or rate-limited content that must not be cached at the CDN.
 */

const CACHE_EXCLUDED_PREFIXES = ["/api", "/pathlight", "/monitoring"];

function shouldCachePathname(pathname: string): boolean {
  return !CACHE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (shouldCachePathname(request.nextUrl.pathname)) {
    /* `s-maxage=3600`: shared (CDN) cache holds the response for 1 hour.
     * `stale-while-revalidate=86400`: serve stale up to 24h after expiry
     * while revalidating in the background. First visitor pays SSR;
     * everyone within the next hour gets the cached HTML.
     * Browsers ignore s-maxage so users always get fresh navigations
     * to the same route in their own session. */
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return response;
}

export const config = {
  /* Skip Next-internal asset routes and API routes entirely.
     API routes don't render the root layout, so they never need
     x-pathname; running middleware on them just adds latency. */
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|brand|images|robots.txt|sitemap.xml|manifest.webmanifest|monitoring).*)",
  ],
};
