import { NextResponse } from "next/server";
import { getVisitorTimeline } from "@/lib/services/analytics";

/* Per-visitor timeline endpoint for the /admin/visitors expandable
 * row UI. Auth is enforced by middleware.ts (admin session required).
 * Visitor id is validated as a UUID inside getVisitorTimeline so any
 * non-conforming input returns an empty array without touching SQL. */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const vid = url.searchParams.get("vid") ?? "";
  if (!UUID.test(vid)) {
    return NextResponse.json({ entries: [] }, { status: 400 });
  }
  const entries = await getVisitorTimeline(vid);
  return NextResponse.json(
    { entries },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
