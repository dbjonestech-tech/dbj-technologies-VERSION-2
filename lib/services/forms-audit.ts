import { z } from "zod";
import type {
  FormDescriptor,
  FormsAuditAnalysis,
  FormsAuditItem,
} from "@/lib/types/scan";
import { callClaudeWithJsonSchema } from "./claude-analysis";

/**
 * Stage 2 forms-audit. Runs as a post-finalize side-step, gated on the
 * presence of at least one extracted <form> on the scanned page. Reads
 * the in-browser DOM walk produced by the screenshot capture step, plus
 * a small slice of the captured HTML for narrative grounding, and asks
 * the model for a per-form critique with a concrete next action.
 *
 * Design constraints honored here:
 *   - Wrapped via callClaudeWithJsonSchema, which itself wraps callWithRetry
 *     and the existing transient-error classification. Direct messages.create
 *     is forbidden by .claude/rules/pathlight.md.
 *   - Temperature 0 (zero sampling drift).
 *   - First-person "I" copy in the system prompt; same in the renderer.
 *   - No mention of internal pipeline machinery in the analysis output.
 *   - Failure is recoverable: any throw here is swallowed by the caller in
 *     lib/inngest/functions.ts so a forms-audit failure never marks a scan
 *     partial. Same posture as the existing audio-summary step.
 */

const formsAuditItemSchema = z.object({
  formIndex: z.number().int().nonnegative(),
  headline: z.string().min(1).max(140),
  observation: z.string().min(1).max(500),
  nextAction: z.string().min(1).max(500),
  impact: z.enum(["high", "medium", "low"]),
});

const formsAuditAnalysisSchema = z.object({
  items: z.array(formsAuditItemSchema).min(1).max(5),
});

const SYSTEM_PROMPT = `You are reviewing the contact and inquiry forms on a small business website. The owner has not asked for help yet; this is a one-page review they will read on their own.

Write in first person ("I noticed..."). Use plain English a non-technical owner can act on. Never mention models, scanning systems, scoring formulas, or any backend machinery. Never describe the review as automated.

For every form on the page, return one item with:
- headline: a short label naming the form ("Your contact form", "The newsletter signup", "The booking form", etc.) and the single biggest issue, in under 12 words.
- observation: 2 to 4 sentences describing what is on the page today, grounded in the real field count, button copy, and labeling status from the data I give you. Quote button copy verbatim when relevant.
- nextAction: a concrete change the owner can make today without hiring anyone, written as an instruction. Examples: "Cut the company-size dropdown and the how-did-you-hear-about-us field; both are optional and slow people down." "Change the submit button copy from 'Submit' to 'Get my free quote'." "Add a label to the phone field; right now screen readers and tab-key users see a blank input."
- impact: high if removing the issue would meaningfully change conversion (long forms, missing labels on required fields, vague button copy on a primary CTA). medium for label gaps on optional fields or weak microcopy. low for stylistic nits.

Rank items by impact. Cap at 5 items. If a form has nothing meaningfully wrong, omit it rather than write filler. If every form is clean, return one neutral item with impact=low describing what is working.

Return ONLY a JSON object matching this schema. No backticks, no explanation, no text outside the JSON.

{
  "items": [
    { "formIndex": <number>, "headline": "<string>", "observation": "<string>", "nextAction": "<string>", "impact": "high" | "medium" | "low" }
  ]
}`;

function truncate(s: string, max: number): string {
  const trimmed = s.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function describeForm(f: FormDescriptor): string {
  const fieldTypeSummary = Object.entries(f.fieldTypes)
    .filter(([t]) => t !== "hidden")
    .map(([t, n]) => `${t}=${n}`)
    .join(", ");
  return [
    `Form ${f.formIndex}:`,
    `  fieldCount=${f.fieldCount} (visible=${f.fieldCount - f.hiddenCount}, hidden=${f.hiddenCount})`,
    `  required=${f.requiredCount}, optional=${f.optionalCount}`,
    `  unlabeledVisibleFields=${f.unlabeledCount}`,
    `  fieldTypes: ${fieldTypeSummary || "(none visible)"}`,
    `  buttonCopy: ${f.buttonCopy ? `"${truncate(f.buttonCopy, 80)}"` : "(no submit button found)"}`,
    `  action: ${f.action ?? "(none)"}`,
    `  method: ${f.method ?? "(unspecified)"}`,
    `  hasAssociatedLabels: ${f.hasLabels ? "yes" : "no"}`,
    `  ariaLabel: ${f.ariaLabel ? `"${truncate(f.ariaLabel, 80)}"` : "(none)"}`,
  ].join("\n");
}

/* HTML excerpt for narrative grounding. Keep small so the prompt stays
 * cheap; the form descriptors carry the structural facts already. The
 * excerpt mostly helps the model name forms naturally ("the booking form"
 * vs "Form 1"). */
const HTML_EXCERPT_CHARS = 6_000;

export async function runFormsAudit(params: {
  scanId: string;
  forms: FormDescriptor[];
  html: string | null;
  url: string;
  businessName: string | null;
  industry: string | null;
  city: string | null;
}): Promise<FormsAuditAnalysis> {
  const { scanId, forms, html, url, businessName, industry, city } = params;
  if (forms.length === 0) {
    /* The pipeline gates on forms.length > 0 before invoking this; this
     * guard exists so a misuse cannot send an empty payload to the model. */
    throw new Error("runFormsAudit called with no forms");
  }

  const userText = [
    `Site: ${url}`,
    `Business: ${businessName ?? "(not provided)"}`,
    `Industry: ${industry ?? "(not provided)"}`,
    `City: ${city ?? "(not provided)"}`,
    ``,
    `FORMS DETECTED ON PAGE`,
    forms.map(describeForm).join("\n\n"),
    ``,
    `HTML EXCERPT (truncated)`,
    html ? truncate(html, HTML_EXCERPT_CHARS) : "(no HTML captured)",
    ``,
    `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
  ].join("\n");

  const result = await callClaudeWithJsonSchema(
    "forms-audit",
    SYSTEM_PROMPT,
    userText,
    formsAuditAnalysisSchema,
    1500,
    0,
    { operation: "forms-audit", scanId },
  );

  /* Final guard: drop any item that names a form index we did not capture.
   * The model is asked to stay grounded but a stray index here would render
   * as a phantom form in the report. */
  const validIndices = new Set(forms.map((f) => f.formIndex));
  const filtered: FormsAuditItem[] = result.items.filter((it) =>
    validIndices.has(it.formIndex),
  );
  return { items: filtered.length > 0 ? filtered : result.items };
}
