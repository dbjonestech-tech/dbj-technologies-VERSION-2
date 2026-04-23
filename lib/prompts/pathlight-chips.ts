import type { PathlightReport } from "@/lib/types/scan";

type PillarKey = "design" | "performance" | "positioning" | "findability";

const PILLAR_TIEBREAK_ORDER: PillarKey[] = [
  "design",
  "performance",
  "positioning",
  "findability",
];

const LOW_PILLAR_CHIP: Record<PillarKey, string> = {
  design: "Why is my design score low?",
  performance: "Why is my site slow?",
  positioning: "How can I improve my messaging?",
  findability: "How can more people find my site?",
};

function pickLowestPillar(
  pillarScores: PathlightReport["pillarScores"]
): PillarKey | null {
  if (!pillarScores) return null;
  let lowestKey: PillarKey | null = null;
  let lowestScore = Number.POSITIVE_INFINITY;
  for (const key of PILLAR_TIEBREAK_ORDER) {
    const score = pillarScores[key];
    if (score < lowestScore) {
      lowestScore = score;
      lowestKey = key;
    }
  }
  return lowestKey;
}

export function generateSuggestedChips(
  report: Pick<PathlightReport, "pillarScores" | "revenueImpact">
): string[] {
  const chips: string[] = ["What should I fix first?"];

  const lowestPillar = pickLowestPillar(report.pillarScores);
  if (lowestPillar) {
    chips.push(LOW_PILLAR_CHIP[lowestPillar]);
  }

  const monthlyLoss = report.revenueImpact?.estimatedMonthlyLoss ?? 0;
  chips.push(
    monthlyLoss > 0
      ? "How much is this really costing me?"
      : "What does a rebuild look like?"
  );

  chips.push("How long would fixes take?");

  return chips;
}
