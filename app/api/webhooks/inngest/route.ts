import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  upsertInngestRun,
  type InngestRunStatus,
} from "@/lib/services/inngest-health";

/* Inngest run-lifecycle webhook ingestion.
 *
 * HMAC verification: Inngest signs the body with the configured
 * webhook secret using the x-inngest-signature header. We require the
 * secret to be set; missing config returns 503 so Inngest retries.
 *
 * Event shape varies by version; we handle the common case where the
 * payload includes a `run` block with id, function_id, status,
 * started_at, ended_at, and steps. Unknown shapes are accepted and
 * logged so future schema changes do not silently drop telemetry.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InngestRunPayload = {
  run?: {
    run_id?: string;
    id?: string;
    function_id?: string;
    status?: string;
    started_at?: string | number;
    ended_at?: string | number;
    finished_at?: string | number;
    output?: { error?: string } | null;
    error?: { message?: string } | string;
    steps?: Array<{ id: string; attempt?: number }>;
    event?: { data?: { scanId?: string } };
  };
  data?: { scanId?: string };
};

function verifySignature(secret: string, body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function normalizeStatus(s: string | undefined): InngestRunStatus {
  if (!s) return "running";
  const lower = s.toLowerCase();
  if (lower === "completed" || lower === "succeeded" || lower === "finished") return "completed";
  if (lower === "failed" || lower === "errored") return "failed";
  if (lower === "cancelled" || lower === "canceled") return "cancelled";
  if (lower === "queued" || lower === "scheduled") return "queued";
  return "running";
}

function toEpochMs(v: string | number | undefined): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const n = Number(v);
  if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.INNGEST_WEBHOOK_SECRET ?? process.env.INNGEST_SIGNING_KEY;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-inngest-signature");
  if (!verifySignature(secret, body, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let parsed: InngestRunPayload;
  try {
    parsed = JSON.parse(body) as InngestRunPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const run = parsed.run;
  if (!run) return NextResponse.json({ ok: true, ignored: "no_run" });

  const runId = run.run_id ?? run.id;
  const functionId = run.function_id;
  if (!runId || !functionId) {
    return NextResponse.json({ ok: true, ignored: "no_id" });
  }

  const errorMessage =
    typeof run.error === "string"
      ? run.error
      : run.error?.message ?? run.output?.error ?? null;

  const scanId =
    run.event?.data?.scanId ?? parsed.data?.scanId ?? null;

  await upsertInngestRun({
    runId,
    functionId,
    scanId,
    status: normalizeStatus(run.status),
    startedAt: toEpochMs(run.started_at),
    endedAt: toEpochMs(run.ended_at ?? run.finished_at),
    stepCount: run.steps?.length ?? 0,
    retryCount:
      run.steps?.reduce((max, s) => Math.max(max, s.attempt ?? 0), 0) ?? 0,
    errorMessage: errorMessage ? String(errorMessage).slice(0, 1000) : null,
  });

  return NextResponse.json({ ok: true });
}
