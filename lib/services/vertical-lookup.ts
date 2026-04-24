import { VERTICALS, type VerticalEntry } from "@/lib/data/verticals";
import type { IndustryBenchmark } from "@/lib/types/scan";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "for",
  "to",
  "in",
  "on",
  "at",
  "by",
  "with",
  "or",
  "it",
  "is",
  "my",
  "service",
  "services",
  "shop",
  "store",
  "company",
  "business",
  "center",
  "centre",
]);

// Generic trailing words that appear across many entries and don't distinguish
// a vertical on their own. When the head-noun of the entry is one of these,
// the head-match bonus is suppressed so coincidental alignment (e.g. "Commercial
// Plumber" winning over "Plumber — Service Call" for input "plumber") can't
// dominate scoring.
const GENERIC_HEADS = new Set([
  "repair",
  "firm",
  "company",
  "contractor",
  "service",
  "services",
  "clinic",
  "office",
  "studio",
  "shop",
  "store",
  "center",
  "agency",
  "group",
  "practice",
  "specialist",
  "provider",
  "professional",
  // Extended beyond the spec list based on diagnostic findings: both appear
  // across several real-estate-adjacent entries, so a trailing "estate" or
  // "agent" should not tip scoring (was causing "real estate" to match
  // "Home Inspector (Real Estate)" and "real estate agent" to match
  // "Luxury Real Estate Agent" over the higher-confidence residential entry).
  "estate",
  "agent",
]);

// Token-level synonyms applied to the input before fuzzy scoring. These
// handle common vision outputs whose wording diverges from the database
// naming convention (e.g. "car" for "auto"). Applied only when the alias
// table doesn't already match.
const SYNONYMS: Record<string, string> = {
  car: "auto",
  attorney: "lawyer",
  bookkeeper: "accounting",
  maid: "cleaning",
  doc: "medical",
  limo: "limousine",
};

// Exact-match alias table. Keys are normalized (lowercase, punctuation
// stripped, whitespace collapsed). Runs BEFORE fuzzy scoring; a hit
// short-circuits to the mapped entry (with businessModel override below).
const ALIASES: Record<string, string> = {
  dj: "DJ / Entertainment Company",
  "pr firm": "PR Firm",
  "it company": "IT Managed Services (MSP) — Annual Contract",
  "it support": "IT Support / Help Desk — Per-Incident",
  "ac repair": "Residential HVAC",
  "ac company": "Residential HVAC",
  "hvac repair": "Residential HVAC",
  vet: "Veterinary Clinic",
  "vet clinic": "Veterinary Clinic",
  "car repair": "Auto Repair (General Mechanic)",
  "car mechanic": "Auto Repair (General Mechanic)",
  "maid service": "House Cleaning (Residential)",
  "dental office": "General / Family Dentistry",
  "law firm": "Personal Injury Law",
  realtor: "Residential Real Estate Agent / Brokerage",
  "mortgage lender": "Mortgage Broker",
  "cat sitter": "Pet Sitting / Dog Walking",
  // Pragmatic additions for common vision outputs whose fuzzy scores fell
  // below threshold or resolved to the wrong peer entry:
  "criminal lawyer": "Criminal Defense",
  "criminal attorney": "Criminal Defense",
  psychologist: "Psychotherapy / Counseling",
  psychology: "Psychotherapy / Counseling",
  roofing: "Residential Roofer",
  "roofing company": "Residential Roofer",
};

const CONFIDENCE_RANK: Record<VerticalEntry["confidence"], number> = {
  high: 3,
  medium: 2,
  "single-source": 1,
};

const ENTRIES_BY_NAME: Map<string, VerticalEntry> = new Map(
  VERTICALS.map((v) => [v.name, v])
);

const ENTRIES_BY_LOWER_NAME: Map<string, VerticalEntry> = new Map(
  VERTICALS.map((v) => [v.name.toLowerCase().trim(), v])
);

function normalizeForAlias(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function expandSynonyms(tokens: string[]): string[] {
  return tokens.map((t) => SYNONYMS[t] ?? t);
}

function normalizeBusinessModel(
  model: string | undefined
): "B2B" | "B2C" | "Mixed" | undefined {
  if (!model) return undefined;
  const lower = model.toLowerCase();
  if (lower === "b2b") return "B2B";
  if (lower === "b2c") return "B2C";
  if (lower === "mixed") return "Mixed";
  return undefined;
}

// Partial match: one token is a prefix of the other. Both tokens must be
// ≥3 chars (lowered from 4 so "law"↔"lawyer" and "vet"↔"veterinary" match).
// Uses up to a 4-char prefix; for tokens shorter than 4 chars, uses the full
// token length so "law" matches "lawyer".
function partialMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  const prefixLen = Math.min(a.length, b.length, 4);
  return (
    a.startsWith(b.slice(0, prefixLen)) || b.startsWith(a.slice(0, prefixLen))
  );
}

function tokenOverlap(
  inferredTokens: string[],
  entryTokens: string[]
): number {
  let overlap = 0;
  for (const token of inferredTokens) {
    if (entryTokens.includes(token)) {
      overlap += 1;
    } else if (entryTokens.some((t) => partialMatch(t, token))) {
      overlap += 0.6;
    }
  }
  return overlap;
}

function scoreMatch(inferredTokens: string[], entry: VerticalEntry): number {
  const entryTokens = tokenize(entry.name);
  if (entryTokens.length === 0 || inferredTokens.length === 0) return 0;

  const overlap = tokenOverlap(inferredTokens, entryTokens);
  if (overlap === 0) return 0;

  const coverage = overlap / inferredTokens.length;

  // Head-noun bonus (multi-token inputs only). Reduced from 0.3 to 0.15 so a
  // coincidental shared trailing token can't overwhelm a full substring match.
  // Suppressed entirely when the head is a generic tail word like "repair" or
  // "firm" — those appear in dozens of entries and carry no vertical-specific
  // meaning.
  let score = coverage;
  if (inferredTokens.length >= 2) {
    const inferredHead = inferredTokens[inferredTokens.length - 1];
    const entryHead = entryTokens[entryTokens.length - 1];
    const headIsGeneric =
      GENERIC_HEADS.has(inferredHead) || GENERIC_HEADS.has(entryHead);
    if (!headIsGeneric && partialMatch(inferredHead, entryHead)) {
      score += 0.15;
    }
  }

  // Substring containment bonus — the whole tokenized input sits inside the
  // entry name. Weighted heavier than head-match so an exact sequence wins
  // over a coincidental tail-word match.
  const entryText = entry.name.toLowerCase();
  const inferredText = inferredTokens.join(" ");
  if (entryText.includes(inferredText)) score += 0.4;

  return score;
}

// Resolve an alias hit to a concrete entry, applying businessModel override
// only when the alias target's name carries a Residential/Commercial marker.
// For model-neutral alias targets (e.g. "PR Firm") we keep the alias entry
// even if the caller's model doesn't match, because no sibling exists.
function resolveAliasEntry(
  aliasEntry: VerticalEntry,
  queryModel: "B2B" | "B2C" | "Mixed" | undefined
): VerticalEntry {
  if (!queryModel || aliasEntry.model === queryModel) return aliasEntry;

  const hasResOrCom = /\b(residential|commercial)\b/i.test(aliasEntry.name);
  if (!hasResOrCom) return aliasEntry;

  const coreTokens = tokenize(aliasEntry.name).filter(
    (t) => t !== "residential" && t !== "commercial"
  );
  if (coreTokens.length === 0) return aliasEntry;

  let best: VerticalEntry | null = null;
  let bestOverlap = 0;
  for (const v of VERTICALS) {
    if (v.model !== queryModel) continue;
    if (v.name === aliasEntry.name) continue;
    const vTokens = tokenize(v.name).filter(
      (t) => t !== "residential" && t !== "commercial"
    );
    let overlapCount = 0;
    for (const t of coreTokens) {
      if (vTokens.includes(t) || vTokens.some((x) => partialMatch(x, t))) {
        overlapCount += 1;
      }
    }
    if (overlapCount > bestOverlap) {
      bestOverlap = overlapCount;
      best = v;
    }
  }

  if (best && bestOverlap >= Math.ceil(coreTokens.length / 2)) return best;
  return aliasEntry;
}

export function lookupVertical(
  inferredVertical: string | undefined,
  businessModel: string | undefined
): VerticalEntry | null {
  if (!inferredVertical || inferredVertical.trim().length === 0) {
    return null;
  }

  const normalizedModel = normalizeBusinessModel(businessModel);

  // Layer 1: exact entry name match (case-insensitive, trimmed). Ensures every
  // database entry self-matches regardless of tokenization quirks.
  const exactKey = inferredVertical.toLowerCase().trim();
  const exactEntry = ENTRIES_BY_LOWER_NAME.get(exactKey);
  if (exactEntry) return exactEntry;

  // Layer 2: alias table. Short forms and synonyms that fuzzy scoring can't
  // reliably resolve (e.g. "DJ", "AC repair", "realtor") map directly to the
  // canonical entry name. Business model override kicks in only for
  // Residential/Commercial-marked alias targets.
  const aliasKey = normalizeForAlias(inferredVertical);
  const aliasTarget = ALIASES[aliasKey];
  if (aliasTarget) {
    const aliasEntry = ENTRIES_BY_NAME.get(aliasTarget);
    if (aliasEntry) return resolveAliasEntry(aliasEntry, normalizedModel);
  }

  // Layer 3: fuzzy scoring. Apply synonym expansion to the tokenized input so
  // common vision outputs reach the right tokens ("car" → "auto",
  // "bookkeeper" → "accounting", etc.).
  const inferredTokens = expandSynonyms(tokenize(inferredVertical));
  if (inferredTokens.length === 0) return null;

  type Scored = { entry: VerticalEntry; score: number };
  const scored: Scored[] = [];
  for (const entry of VERTICALS) {
    const score = scoreMatch(inferredTokens, entry);
    if (score > 0) scored.push({ entry, score });
  }

  if (scored.length === 0) return null;

  // Default to B2C for tie-breaking when no model was supplied — most
  // small-business scans on Pathlight are consumer-facing. This does NOT
  // filter B2B entries; they can still win on raw score.
  const effectiveModel: "B2B" | "B2C" | "Mixed" = normalizedModel ?? "B2C";

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aM = a.entry.model === effectiveModel ? 1 : 0;
    const bM = b.entry.model === effectiveModel ? 1 : 0;
    if (bM !== aM) return bM - aM;

    const confDiff =
      CONFIDENCE_RANK[b.entry.confidence] - CONFIDENCE_RANK[a.entry.confidence];
    if (confDiff !== 0) return confDiff;

    // Generalist preference: "Dentist" → "General / Family Dentistry" over
    // "Cosmetic Dentistry" when everything else ties.
    const aGen = /\b(general|family)\b/i.test(a.entry.name) ? 1 : 0;
    const bGen = /\b(general|family)\b/i.test(b.entry.name) ? 1 : 0;
    if (bGen !== aGen) return bGen - aGen;

    // Final tiebreaker: prefer shorter, more focused entries. "Pediatrics"
    // (1 meaningful token) beats "Pediatric Dentistry" (2) for input
    // "pediatrician" when both score and all other tiebreakers tie.
    return tokenize(a.entry.name).length - tokenize(b.entry.name).length;
  });

  const best = scored[0];
  if (best.score < 0.55) return null;
  return best.entry;
}

export function buildBenchmarkFromVertical(entry: VerticalEntry): IndustryBenchmark {
  const confidenceMap: Record<VerticalEntry["confidence"], IndustryBenchmark["confidence"]> = {
    high: "high",
    medium: "medium",
    "single-source": "low",
  };

  return {
    avgDealValue: Math.round(entry.deal),
    dealValueLow: Math.round(entry.dealLow),
    dealValueHigh: Math.round(entry.dealHigh),
    avgMonthlyVisitors: Math.round(entry.visitors),
    visitorsLow: Math.round(entry.visitors * 0.6),
    visitorsHigh: Math.round(entry.visitors * 1.4),
    source: `Pathlight Curated Database (${entry.confidence} confidence)`,
    confidence: confidenceMap[entry.confidence],
  };
}
