import type { PathlightReport } from "@/lib/types/scan";

type PillarKey = "design" | "performance" | "positioning" | "searchVisibility";

const PILLAR_TIEBREAK_ORDER: PillarKey[] = [
  "design",
  "performance",
  "positioning",
  "searchVisibility",
];

const LOW_PILLAR_CHIP: Record<PillarKey, string> = {
  design: "Why is my design score low?",
  performance: "Why is my site slow?",
  positioning: "How can I improve my messaging?",
  searchVisibility: "How can more people find my site?",
};

function pickLowestPillar(
  pillarScores: PathlightReport["pillarScores"]
): PillarKey | null {
  if (!pillarScores) return null;
  let lowestKey: PillarKey | null = null;
  let lowestScore = Number.POSITIVE_INFINITY;
  for (const key of PILLAR_TIEBREAK_ORDER) {
    const score = pillarScores[key];
    if (score === null) continue;
    if (score < lowestScore) {
      lowestScore = score;
      lowestKey = key;
    }
  }
  return lowestKey;
}

/* Stage 1: surface a finding-aware chip when the page-critique landed and
 * either the headline alternatives are present OR at least one CTA scored
 * low visibility. The chip text references the finding without leaking
 * internal terminology. */
function pageCritiqueChip(
  pageCritique: PathlightReport["pageCritique"],
): string | null {
  if (!pageCritique) return null;
  const hasLowVisCta = pageCritique.ctas.some((c) => c.visibility <= 4);
  if (hasLowVisCta) return "Which CTA should I rewrite first?";
  if (pageCritique.headline.alternatives.length > 0) {
    return "Walk me through the headline alternatives";
  }
  return null;
}

/* Stage 2: surface a forms-audit-aware chip when the analysis landed with
 * at least one high-impact item. */
function formsAuditChip(
  formsAudit: PathlightReport["formsAudit"],
): string | null {
  if (!formsAudit?.analysis) return null;
  const hasHigh = formsAudit.analysis.items.some((i) => i.impact === "high");
  if (hasHigh) return "What is wrong with my form?";
  return null;
}

export function generateSuggestedChips(
  report: Pick<
    PathlightReport,
    "pillarScores" | "revenueImpact" | "pageCritique" | "formsAudit"
  >,
): string[] {
  const chips: string[] = ["What should I fix first?"];

  /* Finding-aware chips first so they out-rank the generic pillar chip
   * when both apply. Cap at 5 visible chips so the strip stays scannable. */
  const critique = pageCritiqueChip(report.pageCritique);
  if (critique) chips.push(critique);

  const forms = formsAuditChip(report.formsAudit);
  if (forms) chips.push(forms);

  const lowestPillar = pickLowestPillar(report.pillarScores);
  if (lowestPillar && chips.length < 4) {
    chips.push(LOW_PILLAR_CHIP[lowestPillar]);
  }

  const monthlyLoss = report.revenueImpact?.estimatedMonthlyLoss ?? 0;
  chips.push(
    monthlyLoss > 0
      ? "How much is this really costing me?"
      : "What does a rebuild look like?"
  );

  if (chips.length < 5) {
    chips.push("How long would fixes take?");
  }

  return chips;
}
