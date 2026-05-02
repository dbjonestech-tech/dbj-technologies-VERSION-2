import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";

/* First-party error ingestion.
 *
 * The ErrorBeacon component on the client mounts window.onerror and
 * unhandledrejection listeners and POSTs here. Server-side handlers
 * may also POST directly. Each event is fingerprinted (sha256 of
 * message + first stack frame) so duplicates collapse in the
 * /admin/errors dashboard.
 *
 * Same-origin only for now. When Canopy starts hosting cross-origin
 * client beacons (white-label deployments phoning home from client
 * sites), wire a CORS allow-list off canopy_settings and gate this
 * route behind it. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Payload {
  message: string;
  stack?: string | null;
  source?: "client" | "server" | "edge" | "cron";
  severity?: "error" | "warning" | "info";
  url?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  releaseSha?: string | null;
}

function topFrame(stack: string | null | undefined): string {
  if (!stack) return "";
  return stack.split("\n").slice(1, 2).map((s) => s.trim()).join("");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Payload | null;
  if (!body || typeof body.message !== "string" || body.message.length === 0) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const headersList = await headers();
  const ua = headersList.get("user-agent");

  const fingerprint = createHash("sha256")
    .update(body.message)
    .update("|")
    .update(topFrame(body.stack))
    .digest("hex");

  try {
    const sql = getDb();
    await sql`
      INSERT INTO error_events
        (fingerprint, source, severity, message, stack, url, user_agent, visitor_id, session_id, release_sha)
      VALUES (
        ${fingerprint},
        ${body.source ?? "client"},
        ${body.severity ?? "error"},
        ${body.message.slice(0, 2000)},
        ${(body.stack ?? null)?.slice(0, 8000) ?? null},
        ${body.url ?? null},
        ${ua ?? null},
        ${body.visitorId ?? null},
        ${body.sessionId ?? null},
        ${body.releaseSha ?? null}
      )
    `;
  } catch {
    /* swallow: ingestion is best-effort, the page that errored should
       not also fail because the error beacon failed to insert. */
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true, fingerprint });
}
