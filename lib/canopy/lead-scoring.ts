import { getDb } from "@/lib/db";
import { getCanopySettings } from "./settings";

export interface LeadScoreComponents {
  pathlight: number;
  engagement: number;
  recency: number;
  touchpoints: number;
  deal_value: number;
  source: number;
}

export interface LeadScoreResult {
  score: number;
  components: LeadScoreComponents;
  /* Raw inputs that produced each component score, useful for the
   * operator-facing breakdown popover. */
  inputs: {
    pathlight_raw: number | null;
    page_views_30d: number;
    last_activity_days: number | null;
    touchpoint_count: number;
    open_deal_value_cents: number;
    source: string | null;
  };
}

const SOURCE_BASE_SCORE: Record<string, number> = {
  pathlight_scan: 80,
  contact_form: 70,
  client_import: 60,
  manual: 50,
};

/* Compute a 0-100 lead score for a contact using the operator's
 * configured weights. Each component normalizes to 0-100 then is
 * weighted-summed; the final clamp is 0-100. */
export async function computeLeadScore(contactId: number): Promise<LeadScoreResult | null> {
  try {
    const sql = getDb();
    const contactRows = (await sql`
      SELECT email, source, created_at FROM contacts WHERE id = ${contactId} LIMIT 1
    `) as Array<{ email: string; source: string | null; created_at: string }>;
    const contact = contactRows[0];
    if (!contact) return null;

    /* pathlight: latest scan score for this email. */
    const pathlightRows = (await sql`
      SELECT sr.pathlight_score::int AS score
      FROM scans s
      LEFT JOIN scan_results sr ON sr.scan_id = s.id
      WHERE LOWER(TRIM(s.email)) = LOWER(TRIM(${contact.email}))
      ORDER BY s.created_at DESC
      LIMIT 1
    `) as Array<{ score: number | null }>;
    const pathlightRaw = pathlightRows[0]?.score ?? null;

    /* engagement: page_views in last 30 days for any session linked to
     * this contact via the analytics chain. The shape of that chain
     * varies by install; we read it best-effort and fall back to 0
     * when the query schema does not match this Canopy install. */
    let pageViews30d = 0;
    try {
      const pvRows = (await sql`
        SELECT COUNT(*)::int AS n
        FROM page_views pv
        JOIN sessions s ON s.id = pv.session_id
        WHERE s.scan_email = ${contact.email}
          AND pv.created_at > NOW() - INTERVAL '30 days'
      `) as Array<{ n: number }>;
      pageViews30d = pvRows[0]?.n ?? 0;
    } catch {
      pageViews30d = 0;
    }

    /* recency: days since last_activity_at (denormalized on contacts). */
    const recencyRows = (await sql`
      SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(last_activity_at, created_at))) / 86400.0 AS days
      FROM contacts WHERE id = ${contactId}
    `) as Array<{ days: number | null }>;
    const lastActivityDays = recencyRows[0]?.days ?? null;

    /* touchpoints: total scans + forms + emails for this contact's email. */
    const touchpointRows = (await sql`
      SELECT
        (SELECT COUNT(*)::int FROM scans s WHERE LOWER(TRIM(s.email)) = LOWER(TRIM(${contact.email}))) AS scans,
        (SELECT COUNT(*)::int FROM contact_submissions cs WHERE cs.email = ${contact.email}) AS forms,
        (SELECT COUNT(*)::int FROM email_events ev WHERE ev.recipient = ${contact.email}) AS emails
    `) as Array<{ scans: number; forms: number; emails: number }>;
    const touchpointCount =
      (touchpointRows[0]?.scans ?? 0) +
      (touchpointRows[0]?.forms ?? 0) +
      (touchpointRows[0]?.emails ?? 0);

    /* deal_value: sum of open deal values for this contact. */
    const dealRows = (await sql`
      SELECT COALESCE(SUM(value_cents), 0)::bigint AS cents
      FROM deals
      WHERE contact_id = ${contactId} AND closed_at IS NULL
    `) as Array<{ cents: number | string }>;
    const openDealValueCents = Number(dealRows[0]?.cents ?? 0);

    const settings = await getCanopySettings();
    const weights = settings.lead_score_weights;

    const pathlightComp = pathlightRaw === null ? 0 : Math.max(0, Math.min(100, pathlightRaw));
    const engagementComp = Math.max(0, Math.min(100, (pageViews30d / 50) * 100));
    const recencyComp =
      lastActivityDays === null
        ? 0
        : Math.max(0, Math.min(100, 100 - (lastActivityDays / 30) * 100));
    const touchpointsComp = Math.max(0, Math.min(100, (touchpointCount / 10) * 100));
    const dealValueComp = Math.max(0, Math.min(100, (openDealValueCents / 1_000_000) * 100));
    const sourceComp = SOURCE_BASE_SCORE[contact.source ?? "manual"] ?? 50;

    const components: LeadScoreComponents = {
      pathlight: pathlightComp,
      engagement: engagementComp,
      recency: recencyComp,
      touchpoints: touchpointsComp,
      deal_value: dealValueComp,
      source: sourceComp,
    };

    const totalWeight =
      (weights.pathlight ?? 0) +
      (weights.engagement ?? 0) +
      (weights.recency ?? 0) +
      (weights.touchpoints ?? 0) +
      (weights.deal_value ?? 0) +
      (weights.source ?? 0);

    if (totalWeight <= 0) {
      return {
        score: 0,
        components,
        inputs: {
          pathlight_raw: pathlightRaw,
          page_views_30d: pageViews30d,
          last_activity_days: lastActivityDays,
          touchpoint_count: touchpointCount,
          open_deal_value_cents: openDealValueCents,
          source: contact.source,
        },
      };
    }

    const weighted =
      pathlightComp * (weights.pathlight ?? 0) +
      engagementComp * (weights.engagement ?? 0) +
      recencyComp * (weights.recency ?? 0) +
      touchpointsComp * (weights.touchpoints ?? 0) +
      dealValueComp * (weights.deal_value ?? 0) +
      sourceComp * (weights.source ?? 0);
    const score = Math.max(0, Math.min(100, Math.round(weighted / totalWeight)));

    return {
      score,
      components,
      inputs: {
        pathlight_raw: pathlightRaw,
        page_views_30d: pageViews30d,
        last_activity_days: lastActivityDays,
        touchpoint_count: touchpointCount,
        open_deal_value_cents: openDealValueCents,
        source: contact.source,
      },
    };
  } catch {
    return null;
  }
}

export async function persistLeadScore(
  contactId: number,
  result: LeadScoreResult
): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO lead_scores (contact_id, score, components)
      VALUES (
        ${contactId},
        ${result.score},
        ${JSON.stringify({ ...result.components, inputs: result.inputs })}::jsonb
      )
    `;
  } catch {
    /* swallow */
  }
}

export interface LatestLeadScore {
  score: number;
  components: Record<string, unknown>;
  computed_at: string;
}

export async function getLatestLeadScore(contactId: number): Promise<LatestLeadScore | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT score, components, computed_at
      FROM lead_scores
      WHERE contact_id = ${contactId}
      ORDER BY computed_at DESC
      LIMIT 1
    `) as LatestLeadScore[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
