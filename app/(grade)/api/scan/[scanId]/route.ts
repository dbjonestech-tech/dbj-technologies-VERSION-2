import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type ScanRow = {
  id: string;
  status: string;
  completed_at: string | null;
  error_message: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  const sql = getDb();
  const rows = (await sql`
    SELECT id, status, completed_at, error_message
    FROM scans
    WHERE id = ${scanId}
    LIMIT 1
  `) as ScanRow[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const row = rows[0]!;
  return NextResponse.json({
    scanId: row.id,
    status: row.status,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
  });
}
