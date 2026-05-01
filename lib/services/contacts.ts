import { getDb } from "@/lib/db";

/**
 * Contacts CRM read service. Pairs with lib/actions/contacts.ts (writes
 * as Server Actions) and migration 022.
 *
 * Identity is unified by email. Anonymous visitors stay on /admin/visitors.
 * Touchpoint counts (scans / forms / emails) are computed inline via
 * LATERAL subqueries against the existing tables; we do not denormalize
 * those counts onto contacts.
 */

export type ContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type ContactSource =
  | "pathlight_scan"
  | "contact_form"
  | "manual"
  | "client_import";

export const CONTACT_STATUSES: readonly ContactStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export const CONTACT_SOURCES: readonly ContactSource[] = [
  "pathlight_scan",
  "contact_form",
  "manual",
  "client_import",
];

export type ContactRow = {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  status: ContactStatus;
  followUpDate: string | null;
  source: ContactSource;
  pathlightScanId: string | null;
  notesCount: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactListRow = ContactRow & {
  /* Inline touchpoint counts. Not "visits" since page_views requires
   * a visitor-id linkage. */
  scanCount: number;
  formCount: number;
  emailCount: number;
};

export type ContactListFilters = {
  status?: ContactStatus | "all";
  source?: ContactSource | "all";
  search?: string;
  overdueOnly?: boolean;
};

export type ContactNoteEntry = {
  id: number;
  contactId: number;
  content: string;
  noteType: "note" | "status_change" | "system";
  createdBy: string | null;
  createdAt: string;
};

export type ContactsDashboardSummary = {
  total: number;
  newThisWeek: number;
  overdue: number;
  byStatus: Record<ContactStatus, number>;
};

const EMPTY_BY_STATUS: Record<ContactStatus, number> = {
  new: 0,
  contacted: 0,
  qualified: 0,
  proposal: 0,
  won: 0,
  lost: 0,
};

function isStatus(s: string): s is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(s);
}

function isSource(s: string): s is ContactSource {
  return (CONTACT_SOURCES as readonly string[]).includes(s);
}

function rowToContact(r: ContactRowDb): ContactRow {
  return {
    id: Number(r.id),
    email: r.email,
    name: r.name,
    company: r.company,
    phone: r.phone,
    website: r.website,
    status: isStatus(r.status) ? r.status : "new",
    followUpDate: r.follow_up_date,
    source: isSource(r.source) ? r.source : "manual",
    pathlightScanId: r.pathlight_scan_id,
    notesCount: Number(r.notes_count),
    lastActivityAt: r.last_activity_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

type ContactRowDb = {
  id: number | string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  follow_up_date: string | null;
  source: string;
  pathlight_scan_id: string | null;
  notes_count: number | string;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getContactsDashboardSummary(): Promise<ContactsDashboardSummary> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new_this_week,
        COUNT(*) FILTER (
          WHERE follow_up_date IS NOT NULL AND follow_up_date < CURRENT_DATE
        )::int AS overdue,
        COUNT(*) FILTER (WHERE status = 'new')::int AS s_new,
        COUNT(*) FILTER (WHERE status = 'contacted')::int AS s_contacted,
        COUNT(*) FILTER (WHERE status = 'qualified')::int AS s_qualified,
        COUNT(*) FILTER (WHERE status = 'proposal')::int AS s_proposal,
        COUNT(*) FILTER (WHERE status = 'won')::int AS s_won,
        COUNT(*) FILTER (WHERE status = 'lost')::int AS s_lost
      FROM contacts
    `) as Array<{
      total: number;
      new_this_week: number;
      overdue: number;
      s_new: number;
      s_contacted: number;
      s_qualified: number;
      s_proposal: number;
      s_won: number;
      s_lost: number;
    }>;
    const r = rows[0];
    if (!r) {
      return { total: 0, newThisWeek: 0, overdue: 0, byStatus: { ...EMPTY_BY_STATUS } };
    }
    return {
      total: Number(r.total),
      newThisWeek: Number(r.new_this_week),
      overdue: Number(r.overdue),
      byStatus: {
        new: Number(r.s_new),
        contacted: Number(r.s_contacted),
        qualified: Number(r.s_qualified),
        proposal: Number(r.s_proposal),
        won: Number(r.s_won),
        lost: Number(r.s_lost),
      },
    };
  } catch (err) {
    console.warn(
      `[contacts] getContactsDashboardSummary failed: ${err instanceof Error ? err.message : err}`
    );
    return { total: 0, newThisWeek: 0, overdue: 0, byStatus: { ...EMPTY_BY_STATUS } };
  }
}

export async function getContacts(
  filters: ContactListFilters = {}
): Promise<ContactListRow[]> {
  try {
    const sql = getDb();
    const status = filters.status && filters.status !== "all" ? filters.status : null;
    const source = filters.source && filters.source !== "all" ? filters.source : null;
    const search = filters.search?.trim() || null;
    const searchPattern = search ? `%${search.replace(/[%_\\]/g, "\\$&")}%` : null;
    const overdueOnly = filters.overdueOnly === true;

    /* Single query with LATERAL touchpoints. Each LATERAL count runs
     * once per contact row using the email index on the source table.
     * scans, contact_submissions, and email_events all index email or
     * scan_id; the LATERAL avoids N round trips from the page. */
    const rows = (await sql`
      SELECT
        c.id, c.email, c.name, c.company, c.phone, c.website,
        c.status, c.follow_up_date, c.source, c.pathlight_scan_id,
        c.notes_count, c.last_activity_at, c.created_at, c.updated_at,
        COALESCE(scan_t.cnt, 0)::int AS scan_count,
        COALESCE(form_t.cnt, 0)::int AS form_count,
        COALESCE(email_t.cnt, 0)::int AS email_count
      FROM contacts c
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM scans s
        WHERE LOWER(TRIM(s.email)) = c.email
      ) scan_t ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM contact_submissions cs
        WHERE LOWER(TRIM(cs.email)) = c.email
      ) form_t ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM email_events ee
        JOIN scans s ON s.id = ee.scan_id
        WHERE LOWER(TRIM(s.email)) = c.email
      ) email_t ON TRUE
      WHERE
        (${status}::text IS NULL OR c.status = ${status}::text)
        AND (${source}::text IS NULL OR c.source = ${source}::text)
        AND (${searchPattern}::text IS NULL OR
             c.email ILIKE ${searchPattern}::text OR
             c.name  ILIKE ${searchPattern}::text OR
             c.company ILIKE ${searchPattern}::text)
        AND (${overdueOnly}::bool IS FALSE OR
             (c.follow_up_date IS NOT NULL AND c.follow_up_date < CURRENT_DATE))
      ORDER BY
        COALESCE(c.last_activity_at, c.created_at) DESC,
        c.id DESC
      LIMIT 200
    `) as Array<
      ContactRowDb & {
        scan_count: number;
        form_count: number;
        email_count: number;
      }
    >;
    return rows.map((r) => ({
      ...rowToContact(r),
      scanCount: Number(r.scan_count),
      formCount: Number(r.form_count),
      emailCount: Number(r.email_count),
    }));
  } catch (err) {
    console.warn(
      `[contacts] getContacts failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export async function getContact(id: number): Promise<ContactRow | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id, email, name, company, phone, website,
        status, follow_up_date, source, pathlight_scan_id,
        notes_count, last_activity_at, created_at, updated_at
      FROM contacts
      WHERE id = ${id}::bigint
      LIMIT 1
    `) as ContactRowDb[];
    return rows[0] ? rowToContact(rows[0]) : null;
  } catch (err) {
    console.warn(
      `[contacts] getContact failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

export async function getContactByEmail(email: string): Promise<ContactRow | null> {
  if (!email) return null;
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        id, email, name, company, phone, website,
        status, follow_up_date, source, pathlight_scan_id,
        notes_count, last_activity_at, created_at, updated_at
      FROM contacts
      WHERE email = ${email.toLowerCase().trim()}::text
      LIMIT 1
    `) as ContactRowDb[];
    return rows[0] ? rowToContact(rows[0]) : null;
  } catch (err) {
    console.warn(
      `[contacts] getContactByEmail failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

/* ─────────────── Pathlight scan card ─────────────── */

export type PathlightScanCard = {
  scanId: string;
  businessName: string | null;
  score: number | null;
  estimatedMonthlyImpact: number | null;
  createdAt: string;
  status: string;
};

/**
 * Most recent completed scan for a contact's email plus a count of any
 * additional historical scans. Surfaces on the Contact detail page as
 * the Pathlight scan card. We never expose internals (model names,
 * pipeline details) per the Pathlight rules; just outcome data.
 */
export async function getPathlightScansForContact(
  email: string
): Promise<{ latest: PathlightScanCard | null; totalCount: number }> {
  if (!email) return { latest: null, totalCount: 0 };
  try {
    const sql = getDb();
    const norm = email.toLowerCase().trim();
    const rows = (await sql`
      SELECT
        s.id::text AS scan_id,
        s.business_name,
        s.created_at,
        s.status,
        sr.pathlight_score,
        sr.revenue_impact
      FROM scans s
      LEFT JOIN scan_results sr ON sr.scan_id = s.id
      WHERE LOWER(TRIM(s.email)) = ${norm}::text
      ORDER BY s.created_at DESC
      LIMIT 1
    `) as Array<{
      scan_id: string;
      business_name: string | null;
      created_at: string;
      status: string;
      pathlight_score: number | null;
      revenue_impact: { estimatedMonthlyLoss?: number | null } | null;
    }>;
    const countRows = (await sql`
      SELECT COUNT(*)::int AS n
      FROM scans
      WHERE LOWER(TRIM(email)) = ${norm}::text
    `) as { n: number }[];
    const total = Number(countRows[0]?.n ?? 0);
    const r = rows[0];
    if (!r) return { latest: null, totalCount: total };
    const monthly = r.revenue_impact?.estimatedMonthlyLoss ?? null;
    return {
      latest: {
        scanId: r.scan_id,
        businessName: r.business_name,
        score: r.pathlight_score,
        estimatedMonthlyImpact:
          typeof monthly === "number" ? monthly : null,
        createdAt: r.created_at,
        status: r.status,
      },
      totalCount: total,
    };
  } catch (err) {
    console.warn(
      `[contacts] getPathlightScansForContact failed: ${err instanceof Error ? err.message : err}`
    );
    return { latest: null, totalCount: 0 };
  }
}

/* ─────────────── Timeline ─────────────── */

export type TimelineEventType =
  | "page_view"
  | "scan"
  | "contact_form"
  | "email"
  | "note"
  | "status_change"
  | "client";

export type TimelineEntry = {
  timestamp: string;
  eventType: TimelineEventType;
  title: string;
  detail: string | null;
  link: string | null;
  meta: Record<string, unknown> | null;
};

const PER_SOURCE_LIMIT = 20;

/**
 * Unified timeline for one contact. Each source CTE is LIMITed BEFORE
 * the union so the page_views table is never fully scanned. The total
 * result is sorted reverse-chronological and capped at the page-level
 * limit. Page views are grouped by session: the existing visitor
 * analytics layer assigns session_id via the `dbj_sid` cookie, so a
 * five-page visit collapses into a single entry.
 */
export async function getContactTimeline(
  email: string,
  contactId: number,
  limit = 50
): Promise<TimelineEntry[]> {
  if (!email) return [];
  try {
    const sql = getDb();
    const cap = Math.max(1, Math.min(200, limit));
    const norm = email.toLowerCase().trim();

    /* Page views: find this email's visitor_id by joining through any
     * scan they ran (scan -> session attached -> visitor_id), then
     * group their page views into one row per session. We deliberately
     * do NOT scan the full page_views table; we narrow first to the
     * sessions we care about. */
    const pageViews = (await sql`
      WITH visitor_ids AS (
        SELECT DISTINCT s.visitor_id
        FROM sessions s
        JOIN scans sc ON sc.id = s.converted_scan_id
        WHERE LOWER(TRIM(sc.email)) = ${norm}::text
        UNION
        SELECT DISTINCT s.visitor_id
        FROM sessions s
        JOIN contact_submissions cs ON cs.id = s.converted_contact_id
        WHERE LOWER(TRIM(cs.email)) = ${norm}::text
      ),
      grouped AS (
        SELECT
          pv.session_id,
          MIN(pv.created_at) AS started_at,
          MAX(pv.created_at) AS ended_at,
          COUNT(*)::int AS view_count,
          string_agg(DISTINCT pv.path, ', ' ORDER BY pv.path) AS paths
        FROM page_views pv
        WHERE pv.visitor_id IN (SELECT visitor_id FROM visitor_ids)
          AND pv.is_bot = false
        GROUP BY pv.session_id
      )
      SELECT * FROM grouped
      ORDER BY started_at DESC
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      session_id: string;
      started_at: string;
      ended_at: string;
      view_count: number;
      paths: string;
    }>;

    const scans = (await sql`
      SELECT
        s.id::text AS scan_id,
        s.business_name,
        s.created_at,
        s.status,
        sr.pathlight_score,
        sr.revenue_impact
      FROM scans s
      LEFT JOIN scan_results sr ON sr.scan_id = s.id
      WHERE LOWER(TRIM(s.email)) = ${norm}::text
      ORDER BY s.created_at DESC
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      scan_id: string;
      business_name: string | null;
      created_at: string;
      status: string;
      pathlight_score: number | null;
      revenue_impact: { estimatedMonthlyLoss?: number | null } | null;
    }>;

    const forms = (await sql`
      SELECT
        id::text AS id,
        message,
        budget,
        project_type,
        created_at
      FROM contact_submissions
      WHERE LOWER(TRIM(email)) = ${norm}::text
      ORDER BY created_at DESC
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      id: string;
      message: string;
      budget: string;
      project_type: string;
      created_at: string;
    }>;

    const emails = (await sql`
      SELECT
        ee.id::text AS id,
        ee.email_type,
        ee.status,
        ee.sent_at
      FROM email_events ee
      JOIN scans s ON s.id = ee.scan_id
      WHERE LOWER(TRIM(s.email)) = ${norm}::text
      ORDER BY ee.sent_at DESC
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      id: string;
      email_type: string;
      status: string;
      sent_at: string;
    }>;

    const notes = (await sql`
      SELECT
        id, content, note_type, created_by, created_at
      FROM contact_notes
      WHERE contact_id = ${contactId}::bigint
      ORDER BY created_at DESC
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      id: number;
      content: string;
      note_type: string;
      created_by: string | null;
      created_at: string;
    }>;

    const clientRows = (await sql`
      SELECT
        c.email, c.name, c.company, c.accepted_at,
        cp.id::text AS project_id, cp.name AS project_name, cp.created_at AS project_created
      FROM clients c
      LEFT JOIN client_projects cp ON cp.client_email = c.email
      WHERE LOWER(TRIM(c.email)) = ${norm}::text
      ORDER BY cp.created_at DESC NULLS LAST
      LIMIT ${PER_SOURCE_LIMIT}
    `) as Array<{
      email: string;
      name: string | null;
      company: string | null;
      accepted_at: string;
      project_id: string | null;
      project_name: string | null;
      project_created: string | null;
    }>;

    const out: TimelineEntry[] = [];

    for (const r of pageViews) {
      const startMs = new Date(r.started_at).getTime();
      const endMs = new Date(r.ended_at).getTime();
      const minutes = Math.round((endMs - startMs) / 60_000);
      out.push({
        timestamp: r.started_at,
        eventType: "page_view",
        title: r.view_count === 1
          ? "Visited 1 page"
          : `Visited ${r.view_count} pages over ${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`,
        detail: r.paths,
        link: `/admin/visitors/sessions/${r.session_id}`,
        meta: { sessionId: r.session_id, viewCount: r.view_count },
      });
    }

    for (const r of scans) {
      const monthly = r.revenue_impact?.estimatedMonthlyLoss ?? null;
      const detailParts: string[] = [];
      if (typeof r.pathlight_score === "number") {
        detailParts.push(`Score: ${r.pathlight_score}/100`);
      }
      if (typeof monthly === "number") {
        detailParts.push(
          `Estimated impact: $${Math.round(monthly).toLocaleString("en-US")}/mo`
        );
      }
      detailParts.push(`Status: ${r.status}`);
      out.push({
        timestamp: r.created_at,
        eventType: "scan",
        title: r.business_name
          ? `Ran a Pathlight scan for ${r.business_name}`
          : "Ran a Pathlight scan",
        detail: detailParts.join(" · "),
        link: `/pathlight/${r.scan_id}`,
        meta: {
          scanId: r.scan_id,
          score: r.pathlight_score,
          estimatedMonthly: monthly,
        },
      });
    }

    for (const r of forms) {
      const preview =
        r.message.length > 200 ? `${r.message.slice(0, 197)}...` : r.message;
      out.push({
        timestamp: r.created_at,
        eventType: "contact_form",
        title: "Submitted the contact form",
        detail: `${r.project_type} · ${r.budget} · ${preview}`,
        link: null,
        meta: { submissionId: r.id, projectType: r.project_type, budget: r.budget },
      });
    }

    for (const r of emails) {
      out.push({
        timestamp: r.sent_at,
        eventType: "email",
        title: `Email ${r.status} (${r.email_type.replace(/_/g, " ")})`,
        detail: null,
        link: null,
        meta: { eventId: r.id, status: r.status, type: r.email_type },
      });
    }

    for (const r of notes) {
      out.push({
        timestamp: r.created_at,
        eventType: r.note_type === "status_change" ? "status_change" : "note",
        title:
          r.note_type === "status_change"
            ? "Status changed"
            : r.note_type === "system"
              ? "System note"
              : "Note added",
        detail: r.content,
        link: null,
        meta: {
          noteId: Number(r.id),
          noteType: r.note_type,
          createdBy: r.created_by,
        },
      });
    }

    if (clientRows.length > 0) {
      const seenAccepted = new Set<string>();
      for (const r of clientRows) {
        const acceptedKey = `accepted-${r.email}`;
        if (!seenAccepted.has(acceptedKey)) {
          seenAccepted.add(acceptedKey);
          out.push({
            timestamp: r.accepted_at,
            eventType: "client",
            title: "Became an engagement client",
            detail: r.company ? `${r.company}` : null,
            link: `/admin/clients`,
            meta: { email: r.email },
          });
        }
        if (r.project_id && r.project_name && r.project_created) {
          out.push({
            timestamp: r.project_created,
            eventType: "client",
            title: `Project created: ${r.project_name}`,
            detail: null,
            link: `/admin/clients`,
            meta: { projectId: r.project_id, projectName: r.project_name },
          });
        }
      }
    }

    return out
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, cap);
  } catch (err) {
    console.warn(
      `[contacts] getContactTimeline failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export async function getContactNotes(
  contactId: number
): Promise<ContactNoteEntry[]> {
  if (!Number.isFinite(contactId) || contactId <= 0) return [];
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, contact_id, content, note_type, created_by, created_at
      FROM contact_notes
      WHERE contact_id = ${contactId}::bigint
      ORDER BY created_at DESC
    `) as Array<{
      id: number | string;
      contact_id: number | string;
      content: string;
      note_type: string;
      created_by: string | null;
      created_at: string;
    }>;
    return rows.map((r) => ({
      id: Number(r.id),
      contactId: Number(r.contact_id),
      content: r.content,
      noteType:
        r.note_type === "status_change" || r.note_type === "system"
          ? r.note_type
          : "note",
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn(
      `[contacts] getContactNotes failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/* ─────────────── Mutations (called from Server Actions) ─────────────── */

export type CreateContactInput = {
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  status?: ContactStatus;
  followUpDate?: string | null;
  source?: ContactSource;
};

export async function createContact(
  input: CreateContactInput
): Promise<ContactRow | null> {
  const email = input.email?.toLowerCase().trim();
  if (!email) return null;
  try {
    const sql = getDb();
    const rows = (await sql`
      INSERT INTO contacts
        (email, name, company, phone, website, status, follow_up_date, source, last_activity_at)
      VALUES (
        ${email}::text,
        ${input.name ?? null},
        ${input.company ?? null},
        ${input.phone ?? null},
        ${input.website ?? null},
        ${input.status ?? "new"}::text,
        ${input.followUpDate ?? null}::date,
        ${input.source ?? "manual"}::text,
        now()
      )
      RETURNING
        id, email, name, company, phone, website,
        status, follow_up_date, source, pathlight_scan_id,
        notes_count, last_activity_at, created_at, updated_at
    `) as ContactRowDb[];
    return rows[0] ? rowToContact(rows[0]) : null;
  } catch (err) {
    console.warn(
      `[contacts] createContact failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

/**
 * Full-record update. The Server Action layer merges the user's patch
 * with the existing contact before calling so we can keep the SQL
 * simple (no per-field nullability tricks) while still supporting
 * clear-to-null on follow_up_date / phone / etc.
 */
export type ContactUpdateFields = {
  name: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  status: ContactStatus;
  followUpDate: string | null;
};

export async function updateContact(
  id: number,
  fields: ContactUpdateFields
): Promise<ContactRow | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    const sql = getDb();
    const rows = (await sql`
      UPDATE contacts SET
        name = ${fields.name},
        company = ${fields.company},
        phone = ${fields.phone},
        website = ${fields.website},
        status = ${fields.status}::text,
        follow_up_date = ${fields.followUpDate}::date,
        updated_at = now(),
        last_activity_at = now()
      WHERE id = ${id}::bigint
      RETURNING
        id, email, name, company, phone, website,
        status, follow_up_date, source, pathlight_scan_id,
        notes_count, last_activity_at, created_at, updated_at
    `) as ContactRowDb[];
    return rows[0] ? rowToContact(rows[0]) : null;
  } catch (err) {
    console.warn(
      `[contacts] updateContact failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

export async function addContactNote(args: {
  contactId: number;
  content: string;
  createdBy?: string | null;
  noteType?: "note" | "status_change" | "system";
}): Promise<ContactNoteEntry | null> {
  const { contactId, content } = args;
  if (!Number.isFinite(contactId) || contactId <= 0) return null;
  if (!content || !content.trim()) return null;
  try {
    const sql = getDb();
    const rows = (await sql`
      INSERT INTO contact_notes (contact_id, content, note_type, created_by)
      VALUES (
        ${contactId}::bigint,
        ${content.trim()}::text,
        ${args.noteType ?? "note"}::text,
        ${args.createdBy ?? null}::text
      )
      RETURNING id, contact_id, content, note_type, created_by, created_at
    `) as Array<{
      id: number | string;
      contact_id: number | string;
      content: string;
      note_type: string;
      created_by: string | null;
      created_at: string;
    }>;
    await sql`
      UPDATE contacts SET
        notes_count = notes_count + 1,
        last_activity_at = now(),
        updated_at = now()
      WHERE id = ${contactId}::bigint
    `;
    const r = rows[0];
    if (!r) return null;
    return {
      id: Number(r.id),
      contactId: Number(r.contact_id),
      content: r.content,
      noteType:
        r.note_type === "status_change" || r.note_type === "system"
          ? r.note_type
          : "note",
      createdBy: r.created_by,
      createdAt: r.created_at,
    };
  } catch (err) {
    console.warn(
      `[contacts] addContactNote failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

export async function deleteContactNote(
  noteId: number,
  contactId: number
): Promise<boolean> {
  if (!Number.isFinite(noteId) || noteId <= 0) return false;
  if (!Number.isFinite(contactId) || contactId <= 0) return false;
  try {
    const sql = getDb();
    /* Only manual notes can be deleted. System and status_change notes
     * are part of the audit trail. */
    const result = (await sql`
      DELETE FROM contact_notes
      WHERE id = ${noteId}::bigint
        AND contact_id = ${contactId}::bigint
        AND note_type = 'note'
      RETURNING id
    `) as Array<{ id: number | string }>;
    if (result.length === 0) return false;
    await sql`
      UPDATE contacts SET
        notes_count = GREATEST(notes_count - 1, 0),
        updated_at = now()
      WHERE id = ${contactId}::bigint
    `;
    return true;
  } catch (err) {
    console.warn(
      `[contacts] deleteContactNote failed: ${err instanceof Error ? err.message : err}`
    );
    return false;
  }
}

/* ─────────────── Sync from existing sources ─────────────── */

export type SyncResult = { created: number; updated: number };

/**
 * Backfill contacts from leads (scans), contact_submissions (forms),
 * and clients (engagement clients). Idempotent: running twice with no
 * new data produces (0, 0). Merge priority: client_import beats
 * contact_form beats pathlight_scan, so a returning prospect who
 * eventually becomes a client surfaces as client_import.
 */
export async function syncContactsFromExistingSources(): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  try {
    const sql = getDb();

    // Pathlight scans -> contacts. Source defaults to pathlight_scan,
    // status defaults to new, name/company stay null (we have neither
    // on the leads row, only email + business_name).
    const scanResult = (await sql`
      INSERT INTO contacts (email, source, status, last_activity_at)
      SELECT
        LOWER(TRIM(l.email)),
        'pathlight_scan',
        'new',
        l.last_scan_at
      FROM leads l
      WHERE l.email IS NOT NULL AND l.email <> ''
      ON CONFLICT (email) DO UPDATE SET
        last_activity_at = GREATEST(
          contacts.last_activity_at,
          EXCLUDED.last_activity_at
        ),
        updated_at = now()
      RETURNING id, (xmax = 0) AS inserted
    `) as Array<{ id: number | string; inserted: boolean }>;

    // Contact-form submissions -> contacts. Source upgrades to
    // contact_form (priority above pathlight_scan). Name/company/phone
    // populated from the most recent submission per email.
    const formResult = (await sql`
      WITH latest AS (
        SELECT DISTINCT ON (LOWER(TRIM(email)))
          LOWER(TRIM(email)) AS email,
          NULLIF(name, '')    AS name,
          NULLIF(company, '') AS company,
          NULLIF(phone, '')   AS phone,
          created_at
        FROM contact_submissions
        WHERE email IS NOT NULL AND email <> ''
        ORDER BY LOWER(TRIM(email)), created_at DESC
      )
      INSERT INTO contacts (email, name, company, phone, source, status, last_activity_at)
      SELECT email, name, company, phone, 'contact_form', 'new', created_at
      FROM latest
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(contacts.name, EXCLUDED.name),
        company = COALESCE(contacts.company, EXCLUDED.company),
        phone = COALESCE(contacts.phone, EXCLUDED.phone),
        source = CASE
          WHEN contacts.source = 'client_import' THEN contacts.source
          ELSE 'contact_form'
        END,
        last_activity_at = GREATEST(
          contacts.last_activity_at,
          EXCLUDED.last_activity_at
        ),
        updated_at = now()
      RETURNING id, (xmax = 0) AS inserted
    `) as Array<{ id: number | string; inserted: boolean }>;

    // Engagement clients -> contacts. Source upgrades to client_import,
    // status set to won (this is the terminal state).
    const clientResult = (await sql`
      INSERT INTO contacts (email, name, company, source, status, last_activity_at)
      SELECT
        LOWER(TRIM(c.email)),
        NULLIF(c.name, ''),
        NULLIF(c.company, ''),
        'client_import',
        'won',
        c.accepted_at
      FROM clients c
      WHERE c.email IS NOT NULL AND c.email <> ''
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(contacts.name, EXCLUDED.name),
        company = COALESCE(contacts.company, EXCLUDED.company),
        source = 'client_import',
        status = 'won',
        last_activity_at = GREATEST(
          contacts.last_activity_at,
          EXCLUDED.last_activity_at
        ),
        updated_at = now()
      RETURNING id, (xmax = 0) AS inserted
    `) as Array<{ id: number | string; inserted: boolean }>;

    for (const r of [...scanResult, ...formResult, ...clientResult]) {
      if (r.inserted) created++;
      else updated++;
    }
    return { created, updated };
  } catch (err) {
    console.warn(
      `[contacts] syncContactsFromExistingSources failed: ${err instanceof Error ? err.message : err}`
    );
    return { created, updated };
  }
}

/* ─────────────── Auto-creation upserts (best-effort) ─────────────── */

/**
 * Best-effort upsert from the scan pipeline finalize step. Never
 * throws: a failure here MUST NOT block the Pathlight pipeline.
 * If the contact already exists, only last_activity_at and the
 * pathlight_scan_id pointer are updated; status, source, and any
 * non-null fields are preserved.
 */
export async function upsertContactFromScan(args: {
  email: string;
  scanId: string;
  businessName?: string | null;
}): Promise<void> {
  const email = args.email?.toLowerCase().trim();
  if (!email) return;
  try {
    const sql = getDb();
    await sql`
      INSERT INTO contacts (email, company, source, status, pathlight_scan_id, last_activity_at)
      VALUES (
        ${email}::text,
        ${args.businessName ?? null},
        'pathlight_scan',
        'new',
        ${args.scanId}::text,
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        pathlight_scan_id = ${args.scanId}::text,
        last_activity_at = now(),
        updated_at = now()
    `;
  } catch (err) {
    console.warn(
      `[contacts] upsertContactFromScan failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Best-effort upsert from the contact form route. Never throws. If the
 * contact already exists, fills in any null fields with the values
 * from this submission but never overwrites a non-null value.
 */
export async function upsertContactFromForm(args: {
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
}): Promise<void> {
  const email = args.email?.toLowerCase().trim();
  if (!email) return;
  try {
    const sql = getDb();
    await sql`
      INSERT INTO contacts (email, name, company, phone, source, status, last_activity_at)
      VALUES (
        ${email}::text,
        ${args.name ?? null},
        ${args.company ?? null},
        ${args.phone ?? null},
        'contact_form',
        'new',
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(contacts.name, EXCLUDED.name),
        company = COALESCE(contacts.company, EXCLUDED.company),
        phone = COALESCE(contacts.phone, EXCLUDED.phone),
        last_activity_at = now(),
        updated_at = now()
    `;
  } catch (err) {
    console.warn(
      `[contacts] upsertContactFromForm failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Best-effort upsert when a client invitation is accepted. Sets the
 * source to client_import and the status to won; this is terminal.
 */
export async function upsertContactFromClient(args: {
  email: string;
  name?: string | null;
  company?: string | null;
}): Promise<void> {
  const email = args.email?.toLowerCase().trim();
  if (!email) return;
  try {
    const sql = getDb();
    await sql`
      INSERT INTO contacts (email, name, company, source, status, last_activity_at)
      VALUES (
        ${email}::text,
        ${args.name ?? null},
        ${args.company ?? null},
        'client_import',
        'won',
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(contacts.name, EXCLUDED.name),
        company = COALESCE(contacts.company, EXCLUDED.company),
        source = 'client_import',
        status = 'won',
        last_activity_at = now(),
        updated_at = now()
    `;
  } catch (err) {
    console.warn(
      `[contacts] upsertContactFromClient failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/* ─────────────── Daily new-contacts series for dashboard sparkline ─────────────── */

export async function getDailyNewContacts(
  days = 14
): Promise<Array<{ date: string; count: number }>> {
  const cap = Math.max(1, Math.min(60, days));
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS n
      FROM contacts
      WHERE created_at > now() - (${cap}::int || ' days')::interval
      GROUP BY day
      ORDER BY day ASC
    `) as { day: string; n: number }[];
    // Fill missing days with 0.
    const byDay = new Map(rows.map((r) => [r.day, Number(r.n)]));
    const out: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = cap - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      out.push({ date: key, count: byDay.get(key) ?? 0 });
    }
    return out;
  } catch (err) {
    console.warn(
      `[contacts] getDailyNewContacts failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/**
 * Last 3 timeline-style events across ALL contacts (not per-contact).
 * Drives the floating "Recent activity" preview on the dashboard
 * Relationships card. Cheap by design: we union the freshest row from
 * each source with a small per-source LIMIT before the union.
 */
export type RecentRelationshipEvent = {
  timestamp: string;
  eventType: "form" | "scan" | "note" | "client";
  email: string;
  title: string;
};

export async function getRecentRelationshipEvents(
  limit = 3
): Promise<RecentRelationshipEvent[]> {
  const cap = Math.max(1, Math.min(10, limit));
  try {
    const sql = getDb();
    const rows = (await sql`
      WITH recent_forms AS (
        SELECT created_at AS ts, email, 'form'::text AS event_type,
               ('Form: ' || COALESCE(name, email)) AS title
        FROM contact_submissions
        ORDER BY created_at DESC LIMIT ${cap}
      ),
      recent_scans AS (
        SELECT created_at AS ts, email, 'scan'::text AS event_type,
               ('Scan: ' || COALESCE(business_name, email)) AS title
        FROM scans
        WHERE email IS NOT NULL
        ORDER BY created_at DESC LIMIT ${cap}
      ),
      recent_notes AS (
        SELECT n.created_at AS ts, c.email, 'note'::text AS event_type,
               ('Note on ' || COALESCE(c.name, c.email)) AS title
        FROM contact_notes n
        JOIN contacts c ON c.id = n.contact_id
        WHERE n.note_type = 'note'
        ORDER BY n.created_at DESC LIMIT ${cap}
      ),
      recent_clients AS (
        SELECT accepted_at AS ts, email, 'client'::text AS event_type,
               ('Client: ' || COALESCE(name, email)) AS title
        FROM clients
        ORDER BY accepted_at DESC LIMIT ${cap}
      )
      SELECT * FROM recent_forms
      UNION ALL SELECT * FROM recent_scans
      UNION ALL SELECT * FROM recent_notes
      UNION ALL SELECT * FROM recent_clients
      ORDER BY ts DESC
      LIMIT ${cap}
    `) as Array<{
      ts: string;
      email: string;
      event_type: "form" | "scan" | "note" | "client";
      title: string;
    }>;
    return rows.map((r) => ({
      timestamp: r.ts,
      email: r.email,
      eventType: r.event_type,
      title: r.title,
    }));
  } catch (err) {
    console.warn(
      `[contacts] getRecentRelationshipEvents failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
