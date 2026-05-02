import { getDb } from "@/lib/db";

/* Merge-field substitution for Canopy email templates.
 *
 * Surface is intentionally narrow:
 *   {{contact.name}}, {{contact.first_name}}, {{contact.email}},
 *   {{contact.company}}, {{contact.website}}, {{contact.phone}}
 *   {{deal.name}}, {{deal.value}}, {{deal.stage}}
 *   {{pathlight.score}}, {{pathlight.url}}
 *   {{user.name}}, {{user.email}}
 *
 * Unknown placeholders are left intact rather than blanked out so the
 * sender notices typos before the recipient does. Whitespace-only
 * substitutions ('{{ contact.name }}') normalize. */

export interface RenderContext {
  contact: {
    id: number;
    email: string;
    name: string | null;
    company: string | null;
    phone: string | null;
    website: string | null;
    pathlightScanId: string | null;
  };
  deal?: {
    id: number;
    name: string;
    value_cents: number;
    currency: string;
    stage: string;
  } | null;
  pathlight?: {
    score: number | null;
    url: string | null;
  } | null;
  user: {
    email: string;
    name: string | null;
  };
}

export function renderTemplate(template: string, ctx: RenderContext): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (full, key: string) => {
    const value = lookupField(key, ctx);
    return value === null || value === undefined ? full : value;
  });
}

function lookupField(key: string, ctx: RenderContext): string | null {
  switch (key) {
    case "contact.name":
      return ctx.contact.name ?? null;
    case "contact.first_name":
      return firstName(ctx.contact.name);
    case "contact.email":
      return ctx.contact.email;
    case "contact.company":
      return ctx.contact.company ?? null;
    case "contact.website":
      return ctx.contact.website ?? null;
    case "contact.phone":
      return ctx.contact.phone ?? null;
    case "deal.name":
      return ctx.deal?.name ?? null;
    case "deal.value":
      return ctx.deal ? formatCurrency(ctx.deal.value_cents, ctx.deal.currency) : null;
    case "deal.stage":
      return ctx.deal?.stage ?? null;
    case "pathlight.score":
      return ctx.pathlight?.score != null ? String(ctx.pathlight.score) : null;
    case "pathlight.url":
      return ctx.pathlight?.url ?? null;
    case "user.name":
      return ctx.user.name ?? null;
    case "user.email":
      return ctx.user.email;
    default:
      return null;
  }
}

function firstName(full: string | null): string | null {
  if (!full) return null;
  const trimmed = full.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/);
  return parts[0] ?? null;
}

function formatCurrency(cents: number, currency: string): string {
  if (!Number.isFinite(cents)) return "";
  const dollars = Math.round(cents / 100);
  if (currency === "USD") return `$${dollars.toLocaleString("en-US")}`;
  return `${dollars.toLocaleString("en-US")} ${currency}`;
}

export const KNOWN_MERGE_FIELDS: readonly string[] = [
  "contact.name",
  "contact.first_name",
  "contact.email",
  "contact.company",
  "contact.website",
  "contact.phone",
  "deal.name",
  "deal.value",
  "deal.stage",
  "pathlight.score",
  "pathlight.url",
  "user.name",
  "user.email",
];

export function detectMergeFields(template: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    found.add(match[1]!);
  }
  return Array.from(found);
}

export async function buildRenderContextForContact(input: {
  contactId: number;
  dealId: number | null;
  userEmail: string;
  userName: string | null;
}): Promise<RenderContext | null> {
  const sql = getDb();
  const contactRows = (await sql`
    SELECT id, email, name, company, phone, website, pathlight_scan_id
    FROM contacts WHERE id = ${input.contactId} LIMIT 1
  `) as Array<{
    id: number;
    email: string;
    name: string | null;
    company: string | null;
    phone: string | null;
    website: string | null;
    pathlight_scan_id: string | null;
  }>;
  const contactRow = contactRows[0];
  if (!contactRow) return null;

  let deal: RenderContext["deal"] = null;
  if (input.dealId) {
    const dealRows = (await sql`
      SELECT id, name, value_cents, currency, stage
      FROM deals WHERE id = ${input.dealId} LIMIT 1
    `) as Array<{
      id: number;
      name: string;
      value_cents: number;
      currency: string;
      stage: string;
    }>;
    deal = dealRows[0] ?? null;
  }

  let pathlight: RenderContext["pathlight"] = null;
  if (contactRow.pathlight_scan_id) {
    const scanRows = (await sql`
      SELECT s.url, sr.pathlight_score
      FROM scans s
      LEFT JOIN scan_results sr ON sr.scan_id = s.id
      WHERE s.id = ${contactRow.pathlight_scan_id}
      LIMIT 1
    `) as Array<{ url: string | null; pathlight_score: number | null }>;
    if (scanRows[0]) {
      pathlight = {
        score: scanRows[0].pathlight_score ?? null,
        url: scanRows[0].url ?? null,
      };
    }
  }

  return {
    contact: {
      id: contactRow.id,
      email: contactRow.email,
      name: contactRow.name,
      company: contactRow.company,
      phone: contactRow.phone,
      website: contactRow.website,
      pathlightScanId: contactRow.pathlight_scan_id,
    },
    deal,
    pathlight,
    user: {
      email: input.userEmail,
      name: input.userName,
    },
  };
}
