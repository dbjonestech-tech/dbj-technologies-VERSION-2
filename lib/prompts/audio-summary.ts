import type {
  IndustryBenchmark,
  PathlightReport,
  RemediationItem,
} from "@/lib/types/scan";

/**
 * The audio summary script needs to be GOOD or this feature damages the
 * brand more than it helps. Every constraint here exists for a specific
 * failure mode observed when generating narration scripts:
 *
 * - "Spell out numbers" -- TTS engines mispronounce digits, especially
 *   prices (`$4,500` becomes "dollar four comma five hundred").
 * - "Single biggest issue" -- a 75-second narration that lists three
 *   problems sounds frantic and forgettable.
 * - "Conservative confidence framing" -- the dollar number is an
 *   estimate. Claiming it as certain undermines the product.
 * - "Avoid acronyms" -- "S-E-O" sounds wrong; "search visibility"
 *   matches what's already on the report.
 * - "End with one specific next action" -- a script that trails off
 *   doesn't convert.
 *
 * The prompt is intentionally long so the model has the rules in
 * context for every generation. Token cost is ~1.5k input / ~250
 * output on Haiku 4.5 = ~$0.002/scan. Negligible.
 */

const SYSTEM_PROMPT = `You are a senior digital strategist preparing a 60-90 second audio summary of a website analysis report. The script will be read aloud by an ElevenLabs text-to-speech voice (warm male, conversational tone), then delivered to the business owner alongside the written report.

Generate a script that an experienced strategist would deliver if they read the full report and called the owner with the punchline.

LENGTH
- 100 to 130 words. Aim for 75 seconds at conversational pace.
- One paragraph in your output, no headers, no list structure.

STRUCTURE (in order)
1. Open with the business name and a one-line framing of where they stand.
2. State the Pathlight Score with one phrase of context (for example "puts you in the middle of the pack for auto repair sites" or "above average for your industry" or "lower than where you need to be to compete locally").
3. Identify ONE biggest issue from the remediation items. Pick the highest-impact item from the data. Do not list multiple. Reference what is wrong and what fixing it would gain them.
4. State the revenue estimate with conservative framing. Use phrases like "conservative estimate," "rough estimate," or "directional." Never claim it as a guarantee.
5. End with ONE specific next action. Either book a discovery call or start with the named fix.

VOICE AND TONE
- Conversational, like a senior consultant on the phone.
- First person singular ("I would start with," "I noticed," "I see").
- Warm but direct. No marketing jargon. No filler.
- Honest. If the score is low, say so. If revenue confidence is low, say so.

TTS-FRIENDLY FORMATTING (critical, the script is read by ElevenLabs)
- Spell out numbers under one hundred. Write "sixty-two," not "62."
- Spell out percentages. Write "twenty percent," not "20%."
- Spell out dollar amounts under ten thousand. Write "four thousand five hundred dollars," not "$4,500."
- For larger amounts, use natural phrasing: "around twenty-three thousand dollars," "roughly twelve thousand a month."
- No quotation marks in the spoken text.
- No em dashes. Use commas, periods, or restructure.
- No acronyms. Expand them: "search visibility" not "SEO," "call to action" not "CTA," "website" not "URL."
- No bullet points or list structure. Continuous prose only.
- Use commas for natural pause rhythm.
- Avoid awkward pronounceable strings (long URLs, scan IDs, hex codes). The script should not contain any.

DO NOT
- Mention "Pathlight" by name more than once. The summary IS the Pathlight output, the listener already knows what they ran.
- Mention internal terminology, model names, or any technical method (no "AI," no "vision audit," no "machine learning").
- Use the words "we" or "our" -- this is a solo studio. First person singular only.
- Pad with pleasantries or sign-offs ("Have a great day"). Cut and end on the next action.

OUTPUT FORMAT
Respond with ONLY the script text. No headers, no metadata, no quote characters wrapping it, no preamble like "Here is the script." Just the prose the TTS will read aloud.`;

function moneyPhrase(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "an unknown amount";
  if (usd < 10_000) return `$${Math.round(usd).toLocaleString("en-US")}`;
  if (usd < 1_000_000) return `$${Math.round(usd).toLocaleString("en-US")}`;
  return `$${(usd / 1_000_000).toFixed(1)}M`;
}

function topRemediation(items: RemediationItem[] | null | undefined): RemediationItem | null {
  if (!items || items.length === 0) return null;
  // Prefer high impact + easy difficulty (ship-quickest), then fall back to the first item.
  const ranked = [...items].sort((a, b) => {
    const impactRank = { high: 0, medium: 1, low: 2 } as const;
    const diffRank = { easy: 0, moderate: 1, hard: 2 } as const;
    const aScore = impactRank[a.impact] * 10 + diffRank[a.difficulty];
    const bScore = impactRank[b.impact] * 10 + diffRank[b.difficulty];
    return aScore - bScore;
  });
  return ranked[0] ?? null;
}

function pillarHighlights(report: PathlightReport): string {
  const p = report.pillarScores;
  if (!p) return "Pillar scores not available.";
  const parts: string[] = [
    `Design ${p.design}/100`,
    `Performance ${p.performance}/100`,
    `Positioning ${p.positioning}/100`,
  ];
  if (typeof p.searchVisibility === "number") {
    parts.push(`Search Visibility ${p.searchVisibility}/100`);
  }
  return parts.join(", ");
}

function benchmarkLine(b: IndustryBenchmark | null): string {
  if (!b) return "(no industry benchmark available)";
  return `Avg deal value $${Math.round(b.avgDealValue).toLocaleString("en-US")} (confidence: ${b.confidence}). Avg monthly visitors for this vertical: ${Math.round(b.avgMonthlyVisitors).toLocaleString("en-US")}.`;
}

function isOutOfScope(report: PathlightReport): boolean {
  return report.businessScale === "national" || report.businessScale === "global";
}

export type AudioPromptResult = {
  system: string;
  user: string;
};

export function buildAudioSummaryPrompt(
  report: PathlightReport
): AudioPromptResult {
  const businessName = report.businessName?.trim() || "this business";
  const url = report.resolvedUrl ?? report.url;
  const industry = report.industry ?? "(not specified)";
  const city = report.city ?? "(not specified)";
  const score =
    typeof report.pathlightScore === "number"
      ? `${report.pathlightScore}/100`
      : "not available";

  const top = topRemediation(report.remediation?.items ?? null);

  const revenue = report.revenueImpact;
  const revenueLine = revenue
    ? `Estimated monthly revenue loss: ${moneyPhrase(revenue.estimatedMonthlyLoss)} (confidence: ${revenue.confidence}). Reasoning: ${revenue.methodology.replace(/\s+/g, " ").slice(0, 600)}`
    : isOutOfScope(report)
      ? `Revenue suppressed: this site reads as a ${report.businessScale} brand, outside Pathlight's calibrated range.`
      : `Revenue estimate not available for this scan.`;

  const userBlock = [
    `BUSINESS`,
    `- Name: ${businessName}`,
    `- URL: ${url}`,
    `- Industry: ${industry}`,
    `- City: ${city}`,
    `- Business Model: ${report.businessModel ?? "not classified"}`,
    `- Vertical: ${report.inferredVertical ?? "not classified"}`,
    `- Scale: ${report.businessScale ?? "not classified"}`,
    ``,
    `SCORES`,
    `- Pathlight Score: ${score}`,
    `- ${pillarHighlights(report)}`,
    ``,
    `REVENUE`,
    `- ${revenueLine}`,
    `- ${benchmarkLine(report.industryBenchmark)}`,
    ``,
    `TOP REMEDIATION ITEM (single biggest issue, picked by impact + difficulty)`,
    top
      ? [
          `- Title: ${top.title}`,
          `- Problem: ${top.problem}`,
          `- Improvement: ${top.improvement}`,
          `- Impact: ${top.impact} | Difficulty: ${top.difficulty}`,
        ].join("\n")
      : `- (no remediation items available)`,
    ``,
    `Generate the 100-130 word spoken script following the rules in the system prompt. Reference ${businessName} by name in the opener. Spell out numbers. End with ONE specific next action.`,
  ].join("\n");

  return { system: SYSTEM_PROMPT, user: userBlock };
}
