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

const CONFIDENCE_RANK: Record<VerticalEntry["confidence"], number> = {
  high: 3,
  medium: 2,
  "single-source": 1,
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
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

// Partial match: one token is a prefix of the other using a 4-character stem.
function partialMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return a.startsWith(b.slice(0, 4)) || b.startsWith(a.slice(0, 4));
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

  // Coverage: what fraction of the inferred tokens found a home in the entry?
  // This naturally penalizes matching on a single shared generic word.
  const coverage = overlap / inferredTokens.length;

  // Head-noun bonus (multi-token inputs only): the last meaningful token in
  // each side. If "Thai Restaurant" and "Fast Casual Restaurant" share the
  // head "restaurant", they're both restaurants. If "Dog Walking" and "Dog
  // Training" share only the modifier "dog" but not the head, they're
  // different services. Skipped for single-token inputs because the head
  // would equal the only token, which unfairly inflates entries that happen
  // to place that token last ("Commercial Plumber" over "Plumber — Service
  // Call (Residential)").
  let score = coverage;
  if (inferredTokens.length >= 2) {
    const inferredHead = inferredTokens[inferredTokens.length - 1];
    const entryHead = entryTokens[entryTokens.length - 1];
    if (partialMatch(inferredHead, entryHead)) score += 0.3;
  }

  // Substring containment bonus — the whole tokenized input sits inside the
  // entry name (e.g. "auto repair" inside "Auto Repair (General Mechanic)").
  // Weighted heavier than head-match so an exact sequence wins over a
  // coincidental tail-word match (e.g. "Auto Upholstery & Interior Repair").
  const entryText = entry.name.toLowerCase();
  const inferredText = inferredTokens.join(" ");
  if (entryText.includes(inferredText)) score += 0.4;

  return score;
}

export function lookupVertical(
  inferredVertical: string | undefined,
  businessModel: string | undefined
): VerticalEntry | null {
  if (!inferredVertical || inferredVertical.trim().length === 0) {
    return null;
  }

  const inferredTokens = tokenize(inferredVertical);
  if (inferredTokens.length === 0) return null;

  const normalizedModel = normalizeBusinessModel(businessModel);

  type Scored = { entry: VerticalEntry; score: number };
  const scored: Scored[] = [];
  for (const entry of VERTICALS) {
    const score = scoreMatch(inferredTokens, entry);
    if (score > 0) scored.push({ entry, score });
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Prefer the entry whose business model matches the input.
    const aM = normalizedModel && a.entry.model === normalizedModel ? 1 : 0;
    const bM = normalizedModel && b.entry.model === normalizedModel ? 1 : 0;
    if (bM !== aM) return bM - aM;

    // Prefer higher confidence.
    const confDiff =
      CONFIDENCE_RANK[b.entry.confidence] - CONFIDENCE_RANK[a.entry.confidence];
    if (confDiff !== 0) return confDiff;

    // Tie-breaker: when the input is generic (no specialty modifier), prefer
    // generalist entries — "Dentist" → "General / Family Dentistry" rather
    // than "Cosmetic Dentistry".
    const aGen = /\b(general|family)\b/i.test(a.entry.name) ? 1 : 0;
    const bGen = /\b(general|family)\b/i.test(b.entry.name) ? 1 : 0;
    return bGen - aGen;
  });

  const best = scored[0];

  // Conservative threshold: a wrong match is worse than no match.
  // 0.55 rejects 1-of-2 generic word overlaps (e.g. "Dog Walking" ↔ "Dog Training",
  // score 0.5) while accepting head-noun matches like "Thai Restaurant" ↔
  // "Fast Casual Restaurant" (score 0.8).
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
