import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { ReportBackdrop } from "../PathlightBackdrop";
import { ScanStatus } from "./ScanStatus";

export const metadata: Metadata = {
  title: "Your Pathlight Report",
  robots: { index: false, follow: false },
};

type ScanRow = {
  id: string;
  url: string;
  status: string;
};

export default async function ScanResultsPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;

  const sql = getDb();
  const rows = (await sql`
    SELECT id, url, status
    FROM scans
    WHERE id = ${scanId}
    LIMIT 1
  `) as ScanRow[];

  if (rows.length === 0) {
    return (
      <>
        <ReportBackdrop />
        <div
          className="relative flex min-h-screen items-center justify-center px-6"
          style={{ color: "#e7ebf2" }}
        >
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold">Scan not found</h1>
            <p className="mt-3 text-sm" style={{ color: "#9aa3b2" }}>
              We couldn&apos;t find a scan with that ID.
            </p>
            <Link
              href="/pathlight"
              className="mt-6 inline-block rounded-full px-5 py-2 text-sm font-semibold"
              style={{
                backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
                color: "white",
              }}
            >
              Start a new scan
            </Link>
          </div>
        </div>
      </>
    );
  }

  const row = rows[0]!;

  return (
    <>
      <ReportBackdrop />
      <ScanStatus
        initial={{
          scanId: row.id,
          url: row.url,
          status: row.status,
        }}
      />
    </>
  );
}
