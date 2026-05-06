import type { PathlightReport } from "@/lib/types/scan";

/**
 * Revenue-estimate trust gate.
 *
 * The dollar number in a Pathlight report IS the credibility moment.
 * A scan that tells a CPA prospect "you are leaving $9,200/mo on the
 * table" against a generic-vertical benchmark with low confidence
 * does more damage to a sales conversation than three failed scans:
 * the prospect remembers the implausible number, not the analysis
 * around it. Joshua's project memory specifically flags
 * "Misclassification → wrong revenue estimate → credibility hit"
 * as a recurring failure mode.
 *
 * This module classifies a finished scan's revenue estimate as
 * trusted or not. Untrusted estimates are:
 *   - Suppressed in the public /api/scan/[scanId] response so the
 *     report page renders a "refining this estimate" placeholder
 *     instead of the embarrassing dollar number.
 *   - Held by the email integrity gate (lib/services/email.ts) so
 *     the prospect never receives the report email or any of the
 *     follow-up sequence emails, which would echo the same number.
 *   - Surfaced in /admin/monitor for Joshua to triage manually.
 *
 * The rules are deliberately conservative. Each fires only on a
 * concrete, defensible signal, never on a single soft cue. False
 * positives cost a held email plus an admin triage; false negatives
 * cost a prospect's trust. The asymmetry favors holding.
 */

export type RevenueTrustReason =
  | "no-revenue-estimate"
  | "b2b-low-deal-value"
  | "implausibly-low-deal-value"
  | "implausibly-high-deal-value-low-confidence"
  | "implausibly-low-visitors"
  | "generic-vertical-low-confidence"
  | "low-confidence-stack";

export type RevenueTrustResult =
  | { trusted: true }
  | { trusted: false; reason: RevenueTrustReason };

/* Generic vertical labels we cannot ground a credible benchmark on.
 * These are the fallback values runVisionAudit / vertical-lookup
 * emit when the model has no high-confidence match. The string
 * comparison is case-insensitive and trims whitespace. */
const GENERIC_VERTICAL_PATTERNS: ReadonlyArray<RegExp> = [
  /^general$/i,
  /^local business$/i,
  /^small business$/i,
  /^other$/i,
  /^unknown$/i,
  /^n\/?a$/i,
];

function isGenericVertical(label: string | undefined | null): boolean {
  const s = (label ?? "").trim();
  if (s.length === 0) return true;
  return GENERIC_VERTICAL_PATTERNS.some((re) => re.test(s));
}

/* The B2B low-deal-value floor. Project memory: "B2B deal values
 * below $500 trigger a warning and floor clamp" — that warning
 * exists in the prompt; this gate makes it load-bearing at the send
 * boundary. A B2B operation (commercial contractor, wholesaler,
 * professional services) with a $400 average deal value is almost
 * always a misclassification of a residential consumer benchmark. */
const B2B_DEAL_FLOOR_USD = 500;

/* Cross-vertical floor below which any deal value looks like
 * garbage benchmark data. $25 is below the rounding threshold for
 * any plausible local business transaction. */
const ANY_DEAL_FLOOR_USD = 25;

/* Cross-vertical ceiling above which the model is almost certainly
 * extrapolating from enterprise data points instead of grounding
 * in a small-business reality. We only fire on this when at least
 * one of the two confidences is "low" so a high-confidence
 * commercial real estate deal ($31,000 in the curated table) does
 * not get held. */
const HIGH_DEAL_CEILING_USD = 100_000;

/* Below this monthly visitor count the revenue model has nothing
 * to multiply against. Sites with under 25 visitors a month are
 * either pre-launch, parked domains, or genuinely zero-traffic
 * operations where the dollar number would be either trivial
 * ($0-50) or fabricated. Either way, do not surface a number. */
const ANY_VISITORS_FLOOR = 25;

export function evaluateRevenueTrust(
  report: PathlightReport,
): RevenueTrustResult {
  const rev = report.revenueImpact;
  if (!rev) return { trusted: false, reason: "no-revenue-estimate" };

  const dealValue = rev.assumptions?.avgDealValue;
  const visitors = rev.assumptions?.estimatedMonthlyVisitors;
  const benchConf = report.industryBenchmark?.confidence ?? null;
  const revConf = rev.confidence;
  const verticalLabel = report.inferredVertical ?? null;
  const businessModel = report.businessModel;

  /* Rule 1: B2B with implausibly low deal value. The strongest
   * signal of vertical misclassification (commercial soil at $400,
   * law firm at $300, etc.) and the rule called out by project
   * memory. */
  if (
    businessModel === "B2B" &&
    typeof dealValue === "number" &&
    dealValue < B2B_DEAL_FLOOR_USD
  ) {
    return { trusted: false, reason: "b2b-low-deal-value" };
  }

  /* Rule 2: implausibly low deal value across any business model.
   * Catches genuinely garbage benchmark data regardless of
   * classification. */
  if (typeof dealValue === "number" && dealValue < ANY_DEAL_FLOOR_USD) {
    return { trusted: false, reason: "implausibly-low-deal-value" };
  }

  /* Rule 3: implausibly high deal value with low confidence on
   * either layer. A high-confidence high deal value (commercial
   * real estate broker, $31,000 in the curated table) passes; a
   * low-confidence one is almost certainly an enterprise-data
   * extrapolation against a small-business site. */
  if (
    typeof dealValue === "number" &&
    dealValue > HIGH_DEAL_CEILING_USD &&
    (benchConf === "low" || revConf === "low")
  ) {
    return {
      trusted: false,
      reason: "implausibly-high-deal-value-low-confidence",
    };
  }

  /* Rule 4: implausibly low visitor estimate. Below this floor the
   * revenue model has nothing meaningful to multiply against. */
  if (typeof visitors === "number" && visitors < ANY_VISITORS_FLOOR) {
    return { trusted: false, reason: "implausibly-low-visitors" };
  }

  /* Rule 5: generic vertical paired with low benchmark confidence.
   * The model could not classify the business AND the benchmark
   * researcher could not ground its numbers. Any dollar figure
   * derived from this combination is unreliable. */
  if (isGenericVertical(verticalLabel) && benchConf === "low") {
    return { trusted: false, reason: "generic-vertical-low-confidence" };
  }

  /* Rule 6: compound low confidence. Both layers (vertical
   * benchmark + revenue model) reported low confidence; the
   * signal-to-noise on the resulting number is too poor to ship. */
  if (revConf === "low" && benchConf === "low") {
    return { trusted: false, reason: "low-confidence-stack" };
  }

  return { trusted: true };
}

/* Operator-facing strings for /admin/monitor and email_events.
 * NOT for the prospect: the public-facing copy on the report page
 * and in held-email logs is intentionally non-specific so the
 * prospect never sees Pathlight's internal trust rules. */
export const REVENUE_TRUST_REASON_LABELS: Record<
  RevenueTrustReason,
  string
> = {
  "no-revenue-estimate":
    "Revenue impact step did not produce an estimate.",
  "b2b-low-deal-value":
    "B2B classification with an implausibly low average deal value (probable vertical misclassification).",
  "implausibly-low-deal-value":
    "Average deal value below the cross-vertical sanity floor.",
  "implausibly-high-deal-value-low-confidence":
    "Average deal value above the small-business ceiling with low confidence on either the benchmark or the revenue model.",
  "implausibly-low-visitors":
    "Estimated monthly visitor count below the floor at which the revenue model can produce a meaningful number.",
  "generic-vertical-low-confidence":
    "Generic vertical classification paired with low-confidence benchmark research.",
  "low-confidence-stack":
    "Both the benchmark research and the revenue model reported low confidence.",
};
