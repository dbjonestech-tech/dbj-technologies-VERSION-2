import { NextResponse } from "next/server";
import { verifyBearer } from "@/lib/canopy/api-tokens";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const verify = await verifyBearer(request.headers.get("authorization"));
  if (!verify.ok) {
    return NextResponse.json({ error: verify.reason ?? "unauthorized" }, { status: 401 });
  }
  if (!verify.scopes?.includes("read")) {
    return NextResponse.json({ error: "token missing 'read' scope" }, { status: 403 });
  }

  const url = new URL(request.url);
  const stage = url.searchParams.get("stage");
  const rawLimit = Number(url.searchParams.get("limit") ?? "50");
  const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));
  const open = url.searchParams.get("open") === "1";

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, name, contact_id, stage,
             value_cents::bigint AS value_cents,
             currency, probability_pct,
             expected_close_at::text AS expected_close_at,
             closed_at::text         AS closed_at,
             won, loss_reason, source,
             created_at::text AS created_at,
             updated_at::text AS updated_at
      FROM deals
      WHERE (${stage}::text IS NULL OR stage = ${stage})
        AND (${open ? 1 : 0}::int = 0 OR closed_at IS NULL)
      ORDER BY id DESC
      LIMIT ${limit}
    `) as Array<Record<string, unknown>>;
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "query failed" },
      { status: 500 }
    );
  }
}
