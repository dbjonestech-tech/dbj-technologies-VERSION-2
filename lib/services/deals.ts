import { getDb } from "@/lib/db";

export type DealStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export const DEAL_STAGES: readonly DealStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export const OPEN_STAGES: readonly DealStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
];

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  new: 10,
  contacted: 25,
  qualified: 50,
  proposal: 70,
  won: 100,
  lost: 0,
};

export interface DealRow {
  id: number;
  name: string;
  contact_id: number;
  contact_email: string;
  contact_name: string | null;
  contact_company: string | null;
  owner_user_id: string | null;
  owner_email: string | null;
  value_cents: number;
  currency: string;
  stage: DealStage;
  probability_pct: number;
  expected_close_at: string | null;
  closed_at: string | null;
  won: boolean | null;
  loss_reason: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealRollups {
  weighted_pipeline_cents: number;
  unweighted_pipeline_cents: number;
  closed_won_this_month_cents: number;
  open_count: number;
  won_this_month_count: number;
  lost_this_month_count: number;
}

export interface StageRollup {
  stage: DealStage;
  count: number;
  value_cents: number;
}

const DEAL_SELECT = `
  d.id,
  d.name,
  d.contact_id,
  c.email AS contact_email,
  c.name  AS contact_name,
  c.company AS contact_company,
  d.owner_user_id,
  d.owner_email,
  d.value_cents::bigint,
  d.currency,
  d.stage,
  d.probability_pct,
  d.expected_close_at,
  d.closed_at,
  d.won,
  d.loss_reason,
  d.source,
  d.notes,
  d.created_at,
  d.updated_at
`;

export async function getDealsForKanban(
  ownerFilter: string | null = null
): Promise<Record<DealStage, DealRow[]>> {
  const empty: Record<DealStage, DealRow[]> = {
    new: [],
    contacted: [],
    qualified: [],
    proposal: [],
    won: [],
    lost: [],
  };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        d.id, d.name, d.contact_id,
        c.email AS contact_email, c.name AS contact_name, c.company AS contact_company,
        d.owner_user_id, d.owner_email,
        d.value_cents::bigint, d.currency, d.stage, d.probability_pct,
        d.expected_close_at, d.closed_at, d.won, d.loss_reason,
        d.source, d.notes, d.created_at, d.updated_at
      FROM deals d
      JOIN contacts c ON c.id = d.contact_id
      WHERE (${ownerFilter}::text IS NULL OR d.owner_email = ${ownerFilter}::text)
      ORDER BY
        CASE d.stage
          WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'qualified' THEN 3
          WHEN 'proposal' THEN 4 WHEN 'won' THEN 5 WHEN 'lost' THEN 6
        END,
        d.value_cents DESC,
        d.updated_at DESC
    `) as DealRow[];
    for (const r of rows) {
      empty[r.stage].push(r);
    }
    return empty;
  } catch {
    return empty;
  }
}

export async function getDeal(id: number): Promise<DealRow | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        d.id, d.name, d.contact_id,
        c.email AS contact_email, c.name AS contact_name, c.company AS contact_company,
        d.owner_user_id, d.owner_email,
        d.value_cents::bigint, d.currency, d.stage, d.probability_pct,
        d.expected_close_at, d.closed_at, d.won, d.loss_reason,
        d.source, d.notes, d.created_at, d.updated_at
      FROM deals d
      JOIN contacts c ON c.id = d.contact_id
      WHERE d.id = ${id}
      LIMIT 1
    `) as DealRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getDealsForContact(contactId: number): Promise<DealRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        d.id, d.name, d.contact_id,
        c.email AS contact_email, c.name AS contact_name, c.company AS contact_company,
        d.owner_user_id, d.owner_email,
        d.value_cents::bigint, d.currency, d.stage, d.probability_pct,
        d.expected_close_at, d.closed_at, d.won, d.loss_reason,
        d.source, d.notes, d.created_at, d.updated_at
      FROM deals d
      JOIN contacts c ON c.id = d.contact_id
      WHERE d.contact_id = ${contactId}
      ORDER BY
        CASE WHEN d.closed_at IS NULL THEN 0 ELSE 1 END,
        d.updated_at DESC
    `) as DealRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getDealRollups(): Promise<DealRollups> {
  const fallback: DealRollups = {
    weighted_pipeline_cents: 0,
    unweighted_pipeline_cents: 0,
    closed_won_this_month_cents: 0,
    open_count: 0,
    won_this_month_count: 0,
    lost_this_month_count: 0,
  };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(SUM(CASE WHEN closed_at IS NULL THEN ROUND(value_cents * (probability_pct::numeric / 100.0)) ELSE 0 END), 0)::bigint AS weighted_pipeline_cents,
        COALESCE(SUM(CASE WHEN closed_at IS NULL THEN value_cents ELSE 0 END), 0)::bigint                                                AS unweighted_pipeline_cents,
        COALESCE(SUM(CASE WHEN won = TRUE  AND closed_at >= date_trunc('month', NOW()) THEN value_cents ELSE 0 END), 0)::bigint           AS closed_won_this_month_cents,
        COUNT(*) FILTER (WHERE closed_at IS NULL)::int                                                                                    AS open_count,
        COUNT(*) FILTER (WHERE won = TRUE  AND closed_at >= date_trunc('month', NOW()))::int                                              AS won_this_month_count,
        COUNT(*) FILTER (WHERE won = FALSE AND closed_at >= date_trunc('month', NOW()))::int                                              AS lost_this_month_count
      FROM deals
    `) as DealRollups[];
    return rows[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getStageRollups(): Promise<StageRollup[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT stage,
             COUNT(*)::int AS count,
             COALESCE(SUM(value_cents), 0)::bigint AS value_cents
      FROM deals
      WHERE closed_at IS NULL
      GROUP BY stage
    `) as StageRollup[];
    return rows;
  } catch {
    return [];
  }
}

export function formatDealValue(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function dealsToTotalCents(rows: DealRow[]): number {
  let n = 0;
  for (const r of rows) n += Number(r.value_cents);
  return n;
}

export { DEAL_SELECT };
