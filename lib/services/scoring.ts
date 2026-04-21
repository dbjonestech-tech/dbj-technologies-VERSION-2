import type {
  DesignScores,
  PillarScores,
  PositioningScores,
} from "@/lib/types/scan";

const DESIGN_KEYS = [
  "hero_impact",
  "typography",
  "spacing",
  "color_discipline",
  "photography_quality",
  "cta_clarity",
  "mobile_experience",
  "trust_signals",
  "brand_coherence",
] as const satisfies ReadonlyArray<keyof DesignScores>;

const POSITIONING_KEYS = [
  "value_proposition",
  "service_clarity",
  "social_proof",
  "contact_accessibility",
  "competitive_differentiation",
] as const satisfies ReadonlyArray<keyof PositioningScores>;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function normalizeDesignScore(scores: DesignScores): number {
  // Each sub-score is already on its own 0-10 or 0-15 scale; the design
  // sub-scores sum to a max of 100, so the raw sum is already a 0-100 value.
  const sum = DESIGN_KEYS.reduce((acc, key) => acc + (scores[key]?.score ?? 0), 0);
  return clamp(Math.round(sum), 0, 100);
}

export function normalizePositioningScore(scores: PositioningScores): number {
  // Five sub-scores, each 0-10 → sum max 50 → scale ×2 to reach 0-100.
  const sum = POSITIONING_KEYS.reduce(
    (acc, key) => acc + (scores[key]?.score ?? 0),
    0
  );
  return clamp(Math.round((sum / 50) * 100), 0, 100);
}

export function calculateFindabilityScore(
  seoScore: number,
  accessibilityScore: number
): number {
  const seo = clamp(seoScore, 0, 100);
  const a11y = clamp(accessibilityScore, 0, 100);
  return clamp(Math.round(seo * 0.7 + a11y * 0.3), 0, 100);
}

export function calculatePathlightScore(
  designScores: DesignScores,
  performanceScore: number,
  positioningScores: PositioningScores,
  lighthouseSeoScore: number,
  lighthouseAccessibilityScore: number
): { pathlightScore: number; pillarScores: PillarScores } {
  const design = normalizeDesignScore(designScores);
  const performance = clamp(Math.round(performanceScore), 0, 100);
  const positioning = normalizePositioningScore(positioningScores);
  const findability = calculateFindabilityScore(
    lighthouseSeoScore,
    lighthouseAccessibilityScore
  );

  const pathlightScore = clamp(
    Math.round(
      design * 0.35 + performance * 0.25 + positioning * 0.25 + findability * 0.15
    ),
    0,
    100
  );

  return {
    pathlightScore,
    pillarScores: { design, performance, positioning, findability },
  };
}
