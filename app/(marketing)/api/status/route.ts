import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCanaryStatus } from "@/lib/services/monitoring";

/* Public lightweight status endpoint.
 *
 * Designed for external uptime probes (UptimeRobot, BetterStack, or
 * any HTTP monitor). Returns a small JSON document with non-sensitive
 * health signals; nothing here exposes Pathlight internals or any
 * customer data.
 *
 * Caching: 30s edge cache so a flood of probes does not pin a function
 * instance polling Postgres. The internal data is happy with that
 * staleness; canary results refresh every 4h anyway.
 */

export const dynamic = "force-dynamic";

type StatusBody = {
  ok: boolean;
  generatedAt: string;
  canary: {
    healthy: boolean;
    lastEventAt: string | null;
    consecutiveFailures: number;
  };
  pathlight: {
    lastScanCompletedAt: string | null;
  };
};

export async function GET(): Promise<Response> {
  let body: StatusBody;
  try {
    const sql = getDb();
    const [canary, scanRows] = await Promise.all([
      getCanaryStatus(),
      sql`
        SELECT completed_at
        FROM scans
        WHERE status = 'complete' AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 1
      ` as unknown as Promise<{ completed_at: string }[]>,
    ]);

    const canaryHealthy =
      canary.lastLevel !== "error" || canary.consecutiveFailures < 2;

    body = {
      ok: canaryHealthy,
      generatedAt: new Date().toISOString(),
      canary: {
        healthy: canaryHealthy,
        lastEventAt: canary.lastEventAt,
        consecutiveFailures: canary.consecutiveFailures,
      },
      pathlight: {
        lastScanCompletedAt: scanRows[0]?.completed_at ?? null,
      },
    };
  } catch (err) {
    body = {
      ok: false,
      generatedAt: new Date().toISOString(),
      canary: {
        healthy: false,
        lastEventAt: null,
        consecutiveFailures: 0,
      },
      pathlight: {
        lastScanCompletedAt: null,
      },
    };
    return NextResponse.json(body, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
