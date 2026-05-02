import { NextResponse } from "next/server";
import { getCanopySettings } from "@/lib/canopy/settings";
import {
  isValidMetricKind,
  recordBeaconPing,
} from "@/lib/canopy/attribution-beacon";

/* Phase 9: attribution beacon ingestion endpoint.
 *
 * Receives lightweight pings from the snippet pasted on a client's
 * post-launch site. The contact id is in the URL path and the snippet
 * is generated per-client at /admin/canopy/beacon. The endpoint is
 * deliberately permissive at the network layer (CORS *) since beacons
 * fire from arbitrary client origins; the gate is at the application
 * layer (attribution_beacon_enabled toggle + contact existence). No
 * scans are triggered; this endpoint only writes a single row. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ contactId: string }> }
) {
  try {
    const settings = await getCanopySettings();
    if (!settings.attribution_beacon_enabled) {
      return NextResponse.json(
        { ok: false, error: "beacon disabled" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const { contactId: contactIdRaw } = await ctx.params;
    const contactId = Number(contactIdRaw);
    if (!Number.isFinite(contactId) || contactId <= 0) {
      return NextResponse.json(
        { ok: false, error: "invalid contact id" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      metric_kind?: string;
      value?: number | string | null;
      payload?: Record<string, unknown> | null;
      origin?: string | null;
    } | null;

    if (!body || !isValidMetricKind(body.metric_kind)) {
      return NextResponse.json(
        { ok: false, error: "invalid metric_kind" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const numericValue = typeof body.value === "number" ? body.value : null;
    const payload =
      body.payload && typeof body.payload === "object" ? body.payload : {};
    const origin = typeof body.origin === "string" ? body.origin.slice(0, 256) : null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

    await recordBeaconPing({
      contactId,
      metricKind: body.metric_kind,
      value: numericValue,
      payload,
      origin,
      userAgent,
    });

    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  } catch {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
}
