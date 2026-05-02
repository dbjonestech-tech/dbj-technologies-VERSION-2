import { getDb } from "@/lib/db";
import type { AttributionEvent, MetricKind } from "./attribution-beacon";

export interface BeaconRollup {
  total_pageviews: number;
  total_sessions: number;
  total_conversions: number;
  total_form_submits: number;
  first_recorded_at: string | null;
  last_recorded_at: string | null;
}

export interface MetricSeries {
  date: string;
  pageviews: number;
  conversions: number;
}

export async function getDealAttributionEvents(
  dealId: number
): Promise<AttributionEvent[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT *
      FROM attribution_events
      WHERE deal_id = ${dealId}
      ORDER BY recorded_at DESC
    `) as AttributionEvent[];
    return rows;
  } catch {
    return [];
  }
}

export async function getContactBeaconRollup(
  contactId: number
): Promise<BeaconRollup> {
  const fallback: BeaconRollup = {
    total_pageviews: 0,
    total_sessions: 0,
    total_conversions: 0,
    total_form_submits: 0,
    first_recorded_at: null,
    last_recorded_at: null,
  };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE metric_kind = 'pageview')::int      AS total_pageviews,
        COUNT(*) FILTER (WHERE metric_kind = 'session_start')::int AS total_sessions,
        COUNT(*) FILTER (WHERE metric_kind = 'conversion')::int    AS total_conversions,
        COUNT(*) FILTER (WHERE metric_kind = 'form_submit')::int   AS total_form_submits,
        MIN(recorded_at) AS first_recorded_at,
        MAX(recorded_at) AS last_recorded_at
      FROM attribution_beacon_data
      WHERE contact_id = ${contactId}
    `) as BeaconRollup[];
    return rows[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getContactBeaconSeries(
  contactId: number,
  days = 30
): Promise<MetricSeries[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT to_char(date_trunc('day', recorded_at), 'YYYY-MM-DD') AS date,
             COUNT(*) FILTER (WHERE metric_kind = 'pageview')::int   AS pageviews,
             COUNT(*) FILTER (WHERE metric_kind = 'conversion')::int AS conversions
      FROM attribution_beacon_data
      WHERE contact_id = ${contactId}
        AND recorded_at >= NOW() - (${days}::int * INTERVAL '1 day')
      GROUP BY date_trunc('day', recorded_at)
      ORDER BY date_trunc('day', recorded_at) ASC
    `) as MetricSeries[];
    return rows;
  } catch {
    return [];
  }
}

export async function getContactRecentBeacon(
  contactId: number,
  limit = 25
): Promise<
  Array<{
    id: number;
    metric_kind: MetricKind;
    value: number | string | null;
    payload: Record<string, unknown>;
    origin: string | null;
    recorded_at: string;
  }>
> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, metric_kind, value, payload, origin, recorded_at
      FROM attribution_beacon_data
      WHERE contact_id = ${contactId}
      ORDER BY recorded_at DESC
      LIMIT ${limit}
    `) as Array<{
      id: number;
      metric_kind: MetricKind;
      value: number | string | null;
      payload: Record<string, unknown>;
      origin: string | null;
      recorded_at: string;
    }>;
    return rows;
  } catch {
    return [];
  }
}
