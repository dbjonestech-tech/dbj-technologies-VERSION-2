import { getDb } from "@/lib/db";
import { getCanopySettings } from "@/lib/canopy/settings";
import { formatDealValue, type DealStage } from "@/lib/services/deals";
import { buildCanopyDigestEmail } from "@/lib/email-templates/canopy-digest";
import { Resend } from "resend";

/* Weekly narrative digest. Read-only against existing tables; never
 * triggers a new Pathlight scan. The Inngest cron only sends when
 * canopy_settings.digest_enabled is true and the cron's UTC fire
 * time matches the operator's chosen local day-of-week + hour after
 * timezone conversion. */

export interface NewContactDigestRow {
  id: number;
  name: string | null;
  email: string;
  source: string;
  created_at: string;
}

export interface OverdueTaskDigestRow {
  id: number;
  title: string;
  contact_id: number | null;
  contact_name: string | null;
  due_at: string;
  priority: string | null;
  days_overdue: number;
}

export interface DealMovementRow {
  id: number;
  name: string;
  contact_name: string | null;
  stage: DealStage;
  value_cents: number;
  closed_at: string | null;
  won: boolean | null;
  loss_reason: string | null;
}

export interface ScoreChangeRow {
  contact_id: number;
  contact_name: string | null;
  contact_email: string;
  previous_score: number;
  current_score: number;
  delta: number;
}

export interface DigestData {
  period_start: string;
  period_end: string;
  new_contacts: NewContactDigestRow[];
  overdue_tasks: OverdueTaskDigestRow[];
  deals_won: DealMovementRow[];
  deals_lost: DealMovementRow[];
  pipeline_value_now_cents: number;
  pipeline_value_prior_cents: number;
  score_changes: ScoreChangeRow[];
  notable_visitor_sessions: number;
}

export async function collectDigestData(asOf: Date = new Date()): Promise<DigestData> {
  const sql = getDb();
  const periodEnd = asOf.toISOString();
  const periodStart = new Date(asOf.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(asOf.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const newContacts = (await sql`
    SELECT id, name, email, source, created_at
    FROM contacts
    WHERE created_at >= ${periodStart}
    ORDER BY created_at DESC
    LIMIT 25
  `) as NewContactDigestRow[];

  const overdueTasks = (await sql`
    SELECT
      a.id,
      COALESCE(a.payload->>'title', 'Untitled task') AS title,
      a.contact_id,
      c.name AS contact_name,
      a.due_at::text AS due_at,
      a.priority,
      GREATEST(0, EXTRACT(EPOCH FROM (NOW() - a.due_at)) / 86400)::int AS days_overdue
    FROM activities a
    LEFT JOIN contacts c ON c.id = a.contact_id
    WHERE a.type = 'task'
      AND a.completed_at IS NULL
      AND a.due_at IS NOT NULL
      AND a.due_at < NOW()
    ORDER BY a.due_at ASC
    LIMIT 25
  `) as OverdueTaskDigestRow[];

  const dealsWonRows = (await sql`
    SELECT d.id, d.name, c.name AS contact_name, d.stage,
           d.value_cents::bigint, d.closed_at::text, d.won, d.loss_reason
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
    WHERE d.won = TRUE AND d.closed_at >= ${periodStart}
    ORDER BY d.closed_at DESC
    LIMIT 25
  `) as DealMovementRow[];

  const dealsLostRows = (await sql`
    SELECT d.id, d.name, c.name AS contact_name, d.stage,
           d.value_cents::bigint, d.closed_at::text, d.won, d.loss_reason
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
    WHERE d.won = FALSE AND d.closed_at >= ${periodStart}
    ORDER BY d.closed_at DESC
    LIMIT 25
  `) as DealMovementRow[];

  const pipelineNow = (await sql`
    SELECT COALESCE(SUM(value_cents), 0)::bigint AS total
    FROM deals
    WHERE closed_at IS NULL
  `) as Array<{ total: number }>;

  const pipelinePrior = (await sql`
    SELECT COALESCE(SUM(value_cents), 0)::bigint AS total
    FROM deals
    WHERE created_at <= ${periodStart}
      AND (closed_at IS NULL OR closed_at > ${periodStart})
  `) as Array<{ total: number }>;

  const scoreChanges = (await sql`
    WITH recent AS (
      SELECT
        l.contact_id,
        l.score AS current_score,
        l.previous_score,
        l.scanned_at,
        ROW_NUMBER() OVER (PARTITION BY l.contact_id ORDER BY l.scanned_at DESC) AS rn
      FROM pathlight_scans_log l
      WHERE l.scanned_at >= ${periodStart}
        AND l.score IS NOT NULL
        AND l.previous_score IS NOT NULL
    )
    SELECT
      r.contact_id,
      c.name AS contact_name,
      c.email AS contact_email,
      r.previous_score,
      r.current_score,
      (r.current_score - r.previous_score) AS delta
    FROM recent r
    LEFT JOIN contacts c ON c.id = r.contact_id
    WHERE r.rn = 1
    ORDER BY ABS(r.current_score - r.previous_score) DESC
    LIMIT 10
  `) as ScoreChangeRow[];

  let visitorCount = 0;
  try {
    const visitorRows = (await sql`
      SELECT COUNT(DISTINCT session_id)::int AS n
      FROM page_views
      WHERE created_at >= ${fourteenDaysAgo}
    `) as Array<{ n: number }>;
    visitorCount = visitorRows[0]?.n ?? 0;
  } catch {
    visitorCount = 0;
  }

  return {
    period_start: periodStart,
    period_end: periodEnd,
    new_contacts: newContacts,
    overdue_tasks: overdueTasks,
    deals_won: dealsWonRows.map((r) => ({ ...r, value_cents: Number(r.value_cents) })),
    deals_lost: dealsLostRows.map((r) => ({ ...r, value_cents: Number(r.value_cents) })),
    pipeline_value_now_cents: Number(pipelineNow[0]?.total ?? 0),
    pipeline_value_prior_cents: Number(pipelinePrior[0]?.total ?? 0),
    score_changes: scoreChanges,
    notable_visitor_sessions: visitorCount,
  };
}

export interface DigestSendResult {
  ok: boolean;
  reason?: string;
  recipients: string[];
  subject?: string;
}

export async function sendCanopyDigest(args: {
  asOf?: Date;
  recipients: string[];
  dryRun?: boolean;
}): Promise<DigestSendResult> {
  const recipients = args.recipients.filter((e) => /.+@.+\..+/.test(e));
  if (recipients.length === 0) {
    return { ok: false, reason: "No valid recipients", recipients: [] };
  }

  const settings = await getCanopySettings();
  const data = await collectDigestData(args.asOf ?? new Date());
  const { subject, html, text } = buildCanopyDigestEmail({
    data,
    fromName: settings.brand_email_from_name,
    accentColor: settings.brand_accent_color,
    formatCurrency: (cents) => formatDealValue(cents, "USD"),
  });

  if (args.dryRun) {
    return { ok: true, recipients, subject };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    return { ok: false, reason: "RESEND_API_KEY or RESEND_FROM_EMAIL missing", recipients };
  }

  try {
    const resend = new Resend(apiKey);
    const fromHeader = settings.brand_email_from_name
      ? `${settings.brand_email_from_name} <${fromAddress.replace(/^.*<([^>]+)>.*$/, "$1") || fromAddress}>`
      : fromAddress;
    await resend.emails.send({
      from: fromHeader,
      to: recipients,
      subject,
      html,
      text,
      tags: [{ name: "category", value: "canopy_digest" }],
    });
    return { ok: true, recipients, subject };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "send failed",
      recipients,
    };
  }
}

/* Cron-side check: should we fire the digest right now? Compares the
 * current UTC timestamp against the operator's stored
 * digest_day_of_week (0=Sun..6=Sat) and digest_hour_local interpreted
 * in settings.timezone. The Inngest cron itself runs hourly; this
 * function decides whether to skip or proceed for the install. */
export function shouldFireDigest(args: {
  now: Date;
  digestEnabled: boolean;
  digestDayOfWeek: number;
  digestHourLocal: number;
  timezone: string;
}): boolean {
  if (!args.digestEnabled) return false;
  try {
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: args.timezone,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    }).formatToParts(args.now);
    const weekdayShort = localParts.find((p) => p.type === "weekday")?.value ?? "";
    const hourStr = localParts.find((p) => p.type === "hour")?.value ?? "";
    const hour = Number.parseInt(hourStr, 10);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dayMap[weekdayShort] ?? -1;
    return dow === args.digestDayOfWeek && hour === args.digestHourLocal;
  } catch {
    return false;
  }
}
