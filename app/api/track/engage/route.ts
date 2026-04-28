import { NextResponse } from "next/server";
import { z } from "zod";
import { recordEngagement } from "@/lib/services/analytics";

/* Engagement + Core Web Vitals beacon ingestion.
 *
 * Called by components/analytics/EngagementBeacon.tsx on
 * visibilitychange (tab blur/focus) and beforeunload via
 * navigator.sendBeacon. May be invoked multiple times per page view;
 * recordEngagement upserts and keeps the running maxima for dwell and
 * scroll, taking the latest non-null value for each CWV metric.
 *
 * Body is intentionally permissive -- any field may be null since the
 * web-vitals package emits LCP/INP/CLS at different lifecycle points.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  pageViewId: z.string().regex(/^\d+$/),
  dwellMs: z.number().int().min(0).max(60 * 60 * 1000).nullable().optional(),
  maxScrollPct: z.number().int().min(0).max(100).nullable().optional(),
  cwvLcpMs: z.number().int().min(0).max(120000).nullable().optional(),
  cwvInpMs: z.number().int().min(0).max(120000).nullable().optional(),
  cwvCls: z.number().min(0).max(10).nullable().optional(),
  cwvTtfbMs: z.number().int().min(0).max(120000).nullable().optional(),
  cwvFcpMs: z.number().int().min(0).max(120000).nullable().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    payload = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const result = await recordEngagement({
    pageViewId: payload.pageViewId,
    dwellMs: payload.dwellMs ?? null,
    maxScrollPct: payload.maxScrollPct ?? null,
    cwvLcpMs: payload.cwvLcpMs ?? null,
    cwvInpMs: payload.cwvInpMs ?? null,
    cwvCls: payload.cwvCls ?? null,
    cwvTtfbMs: payload.cwvTtfbMs ?? null,
    cwvFcpMs: payload.cwvFcpMs ?? null,
  });

  return NextResponse.json({ ok: result.ok });
}
