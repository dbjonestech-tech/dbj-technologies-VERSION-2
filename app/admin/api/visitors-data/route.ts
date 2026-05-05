import { NextResponse } from "next/server";
import {
  getVisitorsDashboardData,
  type DashboardRange,
} from "@/lib/services/analytics";

/* Dashboard payload for the redesigned /admin/visitors page. Auth is
 * enforced by proxy.ts (admin session required for /admin/*).
 * The route accepts either a preset range (range=7d|14d|30d|90d) or
 * an absolute window (from=YYYY-MM-DD&to=YYYY-MM-DD). Dates are
 * normalized server-side; invalid input falls back to 30d. */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_RANGES: ReadonlySet<DashboardRange> = new Set([
  "7d",
  "14d",
  "30d",
  "90d",
]);

function parseDateOnly(raw: string | null, variant: "from" | "to"): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const t = Date.parse(raw + "T00:00:00.000Z");
  if (!Number.isFinite(t)) return null;
  if (variant === "to") {
    return new Date(t + 86_400_000 - 1).toISOString();
  }
  return new Date(t).toISOString();
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rangeRaw = url.searchParams.get("range");
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");

  const fromIso = parseDateOnly(fromRaw, "from");
  const toIso = parseDateOnly(toRaw, "to");

  const data =
    fromIso && toIso
      ? await getVisitorsDashboardData({ from: fromIso, to: toIso })
      : await getVisitorsDashboardData({
          range:
            rangeRaw && VALID_RANGES.has(rangeRaw as DashboardRange)
              ? (rangeRaw as DashboardRange)
              : "30d",
        });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
