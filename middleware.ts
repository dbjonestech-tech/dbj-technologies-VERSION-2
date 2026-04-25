import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Forward the request pathname to the React server tree as `x-pathname`
   so app/layout.tsx can conditionally apply an inline dark background
   on the homepage's <html> element at first paint. Without this header,
   the root layout has no built-in way to read the URL during SSR, and
   the only flash-free way to color the canvas before CSS loads is an
   inline style on the root element itself. */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  /* Skip Next-internal asset routes; we only need the pathname for
     pages that render the root layout. */
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|brand|images|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};
