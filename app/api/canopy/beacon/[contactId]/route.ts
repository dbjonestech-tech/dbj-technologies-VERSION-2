import { NextResponse } from "next/server";
import { getCanopySettings } from "@/lib/canopy/settings";
import {
  isValidMetricKind,
  recordBeaconPing,
} from "@/lib/canopy/attribution-beacon";
import {
  beaconContactLimiter,
  beaconIpLimiter,
  extractIp,
} from "@/lib/rate-limit";

/* Phase 9: attribution beacon ingestion endpoint.
 *
 * Receives lightweight pings from the snippet pasted on a client's
 * post-launch site. The contact id is in the URL path and the snippet
 * is generated per-client at /admin/canopy/beacon. The endpoint is
 * deliberately permissive at the network layer (CORS *) since beacons
 * fire from arbitrary client origins; the gate is at the application
 * layer (attribution_beacon_enabled toggle + contact existence). No
 * scans are triggered; this endpoint only writes a single row.
 *
 * Defense layers, in order of cost:
 *   1. Master toggle (attribution_beacon_enabled, default false)
 *   2. contactId shape validation
 *   3. Payload size cap (8 KB raw body) - rejects flood-by-payload-bloat
 *      before the JSON parser, before any DB write
 *   4. Per-IP rate limit (60/min) - one attacker, one address
 *   5. Per-contactId rate limit (600/hour) - caps total writes against
 *      any one contact even if the attacker rotates IPs
 *   6. metric_kind enum validation
 *
 * Rate limits fail open if Upstash is unreachable (the master toggle is
 * the primary gate; never silently drop beacons from a real buyer's
 * site over a Redis hiccup). */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
} as const;

/* Beacon payloads are tiny: pageview + form_submit + core_web_vital
 * fit in well under 1 KB. 8 KB leaves room for a custom-event payload
 * with a few small fields. Rejecting larger bodies at the boundary
 * stops a flood-by-payload-bloat attack without any DB or JSON
 * parser cost. */
const MAX_BEACON_BYTES = 8 * 1024;

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

    /* Read the body as text first so we can size-cap it before the
     * JSON parser (and before any rate-limiter call). The raw byte
     * budget is conservative; a JSON object encoding pageview path +
     * referrer fits comfortably under 1 KB. */
    const rawBody = await req.text();
    if (rawBody.length > MAX_BEACON_BYTES) {
      return NextResponse.json(
        { ok: false, error: "payload too large" },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    /* Per-IP first (cheaper key, narrower attack), then per-contactId. */
    const ip = extractIp(req);
    const ipCheck = await beaconIpLimiter(ip);
    if (!ipCheck.success) {
      return NextResponse.json(
        { ok: false, error: "rate limited" },
        { status: 429, headers: CORS_HEADERS }
      );
    }
    const contactCheck = await beaconContactLimiter(contactId);
    if (!contactCheck.success) {
      return NextResponse.json(
        { ok: false, error: "rate limited" },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    type BeaconBody = {
      metric_kind?: string;
      value?: number | string | null;
      payload?: Record<string, unknown> | null;
      origin?: string | null;
    };
    let body: BeaconBody | null = null;
    try {
      body = JSON.parse(rawBody) as BeaconBody;
    } catch {
      body = null;
    }

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
