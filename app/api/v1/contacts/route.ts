import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyBearer } from "@/lib/canopy/api-tokens";
import { getDb } from "@/lib/db";

/* GET /api/v1/contacts - list contacts with cursor pagination.
 *
 * Auth: Authorization: Bearer cnpy_<token> with scope=read.
 * Pagination: ?limit=50&before=<id>. Limit clamps to [1, 200].
 *
 * Returns minimal CRM-shaped JSON; field set is stable contract for
 * external integrators. Internal-only fields (last_activity_at
 * denorms, etc.) live on the Server Component pages, not the API. */

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
  const rawLimit = Number(url.searchParams.get("limit") ?? "50");
  const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));
  const beforeRaw = url.searchParams.get("before");
  const before = beforeRaw ? Number(beforeRaw) : null;

  try {
    const sql = getDb();
    const rows = before
      ? ((await sql`
          SELECT id, name, email, company, phone, website, status, source,
                 follow_up_date::text AS follow_up_date,
                 created_at::text AS created_at,
                 updated_at::text AS updated_at
          FROM contacts
          WHERE id < ${before}
          ORDER BY id DESC
          LIMIT ${limit}
        `) as Array<Record<string, unknown>>)
      : ((await sql`
          SELECT id, name, email, company, phone, website, status, source,
                 follow_up_date::text AS follow_up_date,
                 created_at::text AS created_at,
                 updated_at::text AS updated_at
          FROM contacts
          ORDER BY id DESC
          LIMIT ${limit}
        `) as Array<Record<string, unknown>>);

    const nextCursor = rows.length === limit ? Number(rows[rows.length - 1]!.id) : null;
    return NextResponse.json({ data: rows, next_cursor: nextCursor });
  } catch (err) {
    /* Don't echo the raw error message to integrators. Postgres errors
     * can include table / column / constraint identifiers that leak
     * schema shape. Log to Sentry for our own debugging; return a
     * generic body. */
    Sentry.captureException(err, { tags: { route: "v1/contacts" } });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
