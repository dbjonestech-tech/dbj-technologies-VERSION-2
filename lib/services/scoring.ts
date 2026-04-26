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

export function calculateSearchVisibilityScore(
  seoScore: number | null,
  accessibilityScore: number | null
): number | null {
  const hasSeo = typeof seoScore === "number" && Number.isFinite(seoScore);
  const hasA11y =
    typeof accessibilityScore === "number" && Number.isFinite(accessibilityScore);
  if (!hasSeo && !hasA11y) return null;
  if (hasSeo && hasA11y) {
    const seo = clamp(seoScore!, 0, 100);
    const a11y = clamp(accessibilityScore!, 0, 100);
    return clamp(Math.round(seo * 0.7 + a11y * 0.3), 0, 100);
  }
  if (hasSeo) return clamp(Math.round(seoScore!), 0, 100);
  return clamp(Math.round(accessibilityScore!), 0, 100);
}

export function calculatePathlightScore(
  designScores: DesignScores,
  performanceScore: number,
  positioningScores: PositioningScores,
  lighthouseSeoScore: number | null,
  lighthouseAccessibilityScore: number | null
): { pathlightScore: number; pillarScores: PillarScores } {
  const design = normalizeDesignScore(designScores);
  const performance = clamp(Math.round(performanceScore), 0, 100);
  const positioning = normalizePositioningScore(positioningScores);
  const searchVisibility = calculateSearchVisibilityScore(
    lighthouseSeoScore,
    lighthouseAccessibilityScore
  );

  // When search visibility is missing, redistribute its 0.15 weight
  // proportionally across the remaining three pillars so the composite
  // stays on a 0-100 scale instead of being silently dragged down.
  const baseWeights = { design: 0.35, performance: 0.25, positioning: 0.25, searchVisibility: 0.15 };
  let pathlightScore: number;
  if (searchVisibility === null) {
    const remaining = baseWeights.design + baseWeights.performance + baseWeights.positioning;
    pathlightScore = clamp(
      Math.round(
        (design * baseWeights.design +
          performance * baseWeights.performance +
          positioning * baseWeights.positioning) /
          remaining
      ),
      0,
      100
    );
  } else {
    pathlightScore = clamp(
      Math.round(
        design * baseWeights.design +
          performance * baseWeights.performance +
          positioning * baseWeights.positioning +
          searchVisibility * baseWeights.searchVisibility
      ),
      0,
      100
    );
  }

  return {
    pathlightScore,
    pillarScores: { design, performance, positioning, searchVisibility },
  };
}
