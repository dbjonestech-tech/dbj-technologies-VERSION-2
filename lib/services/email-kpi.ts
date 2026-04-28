import { getDb } from "@/lib/db";

/**
 * Email deliverability KPIs over email_events.
 *
 * The materialized view email_kpi_daily_v rolls up sent/delivered/
 * bounced/complained counts per (day, email_type). emailKpiRefreshHourly
 * runs the REFRESH; reads here join across days for the dashboard.
 *
 * Bounce-rate and complaint-rate alerts at 2% / 0.1% (Resend's policy
 * thresholds). The dashboard renders the rolling 7-day numbers in
 * red when crossed; a Sentry warning fires from the cost-monitor cron.
 */

export async function refreshEmailKpi(): Promise<{ ok: boolean }> {
  try {
    const sql = getDb();
    await sql`REFRESH MATERIALIZED VIEW email_kpi_daily_v`;
    return { ok: true };
  } catch (err) {
    console.warn(
      `[email-kpi] refresh failed: ${err instanceof Error ? err.message : err}`
    );
    return { ok: false };
  }
}

export type EmailKpiSummary = {
  emailType: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  delayed: number;
  deliveryRatePct: number;
  bounceRatePct: number;
  complaintRatePct: number;
};

export async function getEmailKpiByType(
  daysBack: number
): Promise<EmailKpiSummary[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(180, daysBack));
    const rows = (await sql`
      SELECT
        email_type,
        SUM(sent)::int AS sent,
        SUM(delivered)::int AS delivered,
        SUM(bounced)::int AS bounced,
        SUM(complained)::int AS complained,
        SUM(failed)::int AS failed,
        SUM(delayed)::int AS delayed
      FROM email_kpi_daily_v
      WHERE day > now() - (${`${days} days`})::interval
      GROUP BY email_type
      ORDER BY sent DESC
    `) as Array<{
      email_type: string;
      sent: number;
      delivered: number;
      bounced: number;
      complained: number;
      failed: number;
      delayed: number;
    }>;
    return rows.map((r) => {
      const sent = Number(r.sent);
      const delivered = Number(r.delivered);
      const bounced = Number(r.bounced);
      const complained = Number(r.complained);
      return {
        emailType: r.email_type,
        sent,
        delivered,
        bounced,
        complained,
        failed: Number(r.failed),
        delayed: Number(r.delayed),
        deliveryRatePct: sent > 0 ? Number(((delivered / sent) * 100).toFixed(2)) : 0,
        bounceRatePct: sent > 0 ? Number(((bounced / sent) * 100).toFixed(2)) : 0,
        complaintRatePct: sent > 0 ? Number(((complained / sent) * 100).toFixed(3)) : 0,
      };
    });
  } catch (err) {
    console.warn(
      `[email-kpi] getEmailKpiByType failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type EmailKpiDailyPoint = {
  day: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
};

export async function getEmailKpiTrend(daysBack: number): Promise<EmailKpiDailyPoint[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(180, daysBack));
    const rows = (await sql`
      SELECT
        day::text AS day,
        SUM(sent)::int AS sent,
        SUM(delivered)::int AS delivered,
        SUM(bounced)::int AS bounced,
        SUM(complained)::int AS complained
      FROM email_kpi_daily_v
      WHERE day > now() - (${`${days} days`})::interval
      GROUP BY day
      ORDER BY day ASC
    `) as Array<{
      day: string;
      sent: number;
      delivered: number;
      bounced: number;
      complained: number;
    }>;
    return rows.map((r) => ({
      day: r.day.slice(0, 10),
      sent: Number(r.sent),
      delivered: Number(r.delivered),
      bounced: Number(r.bounced),
      complained: Number(r.complained),
    }));
  } catch (err) {
    console.warn(
      `[email-kpi] getEmailKpiTrend failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
