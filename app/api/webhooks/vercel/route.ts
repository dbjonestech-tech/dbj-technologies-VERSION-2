import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { upsertDeploymentEvent } from "@/lib/services/vercel-platform";

/* Vercel deployment webhook ingestion.
 *
 * HMAC verification: Vercel signs the body with VERCEL_WEBHOOK_SECRET
 * via the x-vercel-signature header (sha1 hex). We require the secret
 * to be set; missing config means we cannot trust the request and
 * return 503 so Vercel will retry.
 *
 * Events we care about (others are ignored gracefully):
 *   deployment.created
 *   deployment.succeeded
 *   deployment.error
 *   deployment.canceled
 *   deployment.ready
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeploymentPayload = {
  type: string;
  payload: {
    deployment: {
      id?: string;
      uid?: string;
      url?: string;
      state?: string;
      target?: string | null;
      createdAt?: number;
      created?: number;
      readyAt?: number;
      ready?: number;
      buildingAt?: number;
      meta?: Record<string, unknown>;
    };
  };
};

function verifySignature(secret: string, body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha1", secret).update(body).digest("hex");
  /* timingSafeEqual requires equal-length buffers; reject any
   * signature that is the wrong length outright instead of throwing. */
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-vercel-signature");
  if (!verifySignature(secret, body, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let parsed: DeploymentPayload;
  try {
    parsed = JSON.parse(body) as DeploymentPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!parsed.type?.startsWith("deployment.")) {
    return NextResponse.json({ ok: true, ignored: parsed.type });
  }

  const dep = parsed.payload?.deployment;
  if (!dep) return NextResponse.json({ ok: true, ignored: "no_deployment" });

  const id = dep.id ?? dep.uid;
  if (!id) return NextResponse.json({ ok: true, ignored: "no_id" });

  /* Vercel uses different field names across event types -- type
   * 'deployment.created' carries createdAt/buildingAt, while
   * 'deployment.succeeded'/'deployment.error' carry ready. Coerce
   * to a single shape before persisting. */
  const stateFromType: Record<string, string> = {
    "deployment.created": "BUILDING",
    "deployment.succeeded": "READY",
    "deployment.ready": "READY",
    "deployment.error": "ERROR",
    "deployment.canceled": "CANCELED",
  };
  const state = dep.state ?? stateFromType[parsed.type] ?? "UNKNOWN";

  const createdAt = dep.createdAt ?? dep.created ?? Date.now();
  const readyAt = dep.readyAt ?? dep.ready ?? null;
  const buildingAt = dep.buildingAt ?? createdAt;
  const buildDurationMs = readyAt && buildingAt ? readyAt - buildingAt : null;

  await upsertDeploymentEvent({
    id,
    url: dep.url ? `https://${dep.url}` : null,
    state,
    target: dep.target ?? null,
    createdAt,
    readyAt,
    buildDurationMs,
    meta: dep.meta ?? {},
  });

  return NextResponse.json({ ok: true });
}
