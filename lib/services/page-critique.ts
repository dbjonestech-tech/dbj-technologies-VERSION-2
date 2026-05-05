import { z } from "zod";
import type {
  DesignScores,
  PageCritiqueResult,
  PerformanceScores,
  PositioningScores,
} from "@/lib/types/scan";
import { callClaudeWithJsonSchema } from "./claude-analysis";

/**
 * Stage 1 page critique. Runs as a post-finalize side-step (mirrors the
 * audio + forms-audit posture: gated, swallowed-on-failure, never marks
 * the scan partial). Produces three concrete deliverables grounded in the
 * desktop above-the-fold:
 *
 *   - ctas: every visible call-to-action (up to 5) with a verbatim text,
 *           location, visibility 1-10, observation, and a "Try this"
 *           concrete next action.
 *   - headline: the verbatim hero headline plus three alternatives written
 *               in the business's voice, each with a short rationale.
 *   - heroObservation: 3-5 sentences describing what a first-time visitor
 *                      sees before scrolling, ending with the single biggest
 *                      change worth considering.
 *
 * Design constraints honored here:
 *  - Wrapped via callClaudeWithJsonSchema, which itself wraps callWithRetry
 *    and the existing transient-error classification. Direct messages.create
 *    is forbidden by .claude/rules/pathlight.md.
 *  - Temperature 0 (deterministic for a given scan).
 *  - First-person "I" copy enforced in the system prompt.
 *  - No internal terminology in the rendered output.
 *  - DESKTOP screenshot only (saves ~50% of vision tokens vs the existing
 *    vision-audit which sends both viewports). The existing call already
 *    covers mobile-specific concerns via its mobile_experience metric.
 *  - Failure is recoverable: any throw here is swallowed by the caller in
 *    lib/inngest/functions.ts so the report is never blocked.
 */

const ctaSchema = z.object({
  text: z.string().min(1).max(200),
  location: z.enum([
    "above-the-fold-hero",
    "above-the-fold-secondary",
    "navigation",
    "later-on-page",
  ]),
  visibility: z.number().int().min(1).max(10),
  observation: z.string().min(1).max(500),
  nextAction: z.string().min(1).max(400),
});

const headlineAlternativeSchema = z.object({
  text: z.string().min(1).max(200),
  rationale: z.string().min(1).max(300),
});

const headlineSchema = z.object({
  current: z.string().min(1).max(300),
  alternatives: z.array(headlineAlternativeSchema).min(2).max(3),
});

const pageCritiqueSchema = z.object({
  heroObservation: z.string().min(20).max(900),
  headline: headlineSchema,
  ctas: z.array(ctaSchema).min(1).max(5),
});

const SYSTEM_PROMPT = `You are reviewing the homepage of a small business website. The owner will read this on their own; nobody is sitting next to them. Write in first person ("I noticed...", "I would test..."). Use plain English a non-technical owner can act on. Never mention models, scanning systems, scoring formulas, or any backend machinery. Never describe the review as automated.

READ THE TOP OF THE PAGE AS A COMPOSITION, NOT AS ISOLATED ELEMENTS. The visitor's first impression is built from at least three layers stacked together: (a) the navigation brand mark plus any tagline next to it (e.g. "Wingert | Real Estate Company"), (b) the hero headline and any subline inside the hero card, and (c) the visible CTAs. When evaluating whether a visitor knows what the business is and what it does, factor ALL THREE layers. If the nav brand mark already names the company plus the category and the hero subline reinforces or completes that category statement, the visitor IS being told what this is; describe the composition. Do not write "the page never says what they do" when the nav clearly says it. Conversely, do not credit the hero with information it does not contain when the nav alone is carrying the load; call out asymmetric reliance on the nav as a finding the owner can address by surfacing the same information inside the hero card itself.

A NOTE ON BACKGROUND VIDEO: many sites place a hero card on top of a looping background video showing their work, their city, or their products. The screenshot you are reading captured one frame of that video. Do NOT assume the page is "broken" or "showing an error" if you see what looks like raw imagery behind a hero card; that is the intended composition. Only flag a broken video if the screenshot literally shows an error string like "Format(s) not supported" or "source not found" overlaid on the page, AND the page text gives you no other signal that the imagery is intentional.

Three deliverables in one JSON object:

1. heroObservation: 3 to 5 sentences describing what a first-time visitor sees in the top of the page without scrolling. Anchor every observation in something concrete you can see (a phone number that is or is not there, a headline that is loud or dull, a primary CTA that is clear or hidden). Read the nav brand mark plus the hero card together as one composition. End with the single biggest thing the owner should consider changing. No "first 5 seconds" framing, no dramatized "your customer thinks" language; describe what is visible, plainly.

2. headline.current: the verbatim text of the hero headline as it appears on the page. Do not paraphrase. If the hero is an image-only hero with no text, return the alt text or the closest visible heading and note that in the rationale of the alternatives.

3. headline.alternatives: exactly three alternative headlines, written in the business's own voice (look at their tone, their service area, their actual offer; do not import a generic agency voice). Each alternative is under 12 words. Each has a short rationale (1 to 2 sentences) explaining what this version does better and who it speaks to.

4. ctas: every clickable call-to-action visible above the fold, plus any unmissable secondary CTAs that appear as you scroll. Cap at 5. Order by importance (the primary conversion CTA first). For each, return:
   - text: the verbatim button or link copy. Quote it exactly.
   - location: "above-the-fold-hero" (the primary hero CTA), "above-the-fold-secondary" (a second AtF CTA like a phone number or chat), "navigation" (a CTA that lives in the top nav), or "later-on-page" (a CTA that is meaningful but only appears below the fold).
   - visibility: 1 to 10 where 10 is impossible to miss. Be honest; if the button is gray on a gray background, it is a 3.
   - observation: 2 to 3 sentences. What is working and what is not. Quote button copy verbatim when relevant.
   - nextAction: a concrete change the owner can make today, written as an instruction. Examples: "Change 'Submit' to 'Get my free quote' and move it above the testimonials block." "Add the phone number as a tap-to-call link in the hero so a mobile visitor can reach you in one tap." "Cut the navigation 'Login' link; this site is for new patients, and 'Login' is for an existing-patient portal that does not yet exist."

If the hero has no clear CTA at all, say so directly in heroObservation and put one item in ctas describing the absence (visibility 1, observation explaining what is missing, nextAction suggesting a concrete CTA to add).

Output shape:
{
  "heroObservation": "<3-5 sentences>",
  "headline": {
    "current": "<verbatim hero headline>",
    "alternatives": [
      { "text": "<alternative headline, under 12 words>", "rationale": "<1-2 sentences>" }
    ]
  },
  "ctas": [
    {
      "text": "<verbatim button or link copy>",
      "location": "above-the-fold-hero" | "above-the-fold-secondary" | "navigation" | "later-on-page",
      "visibility": <integer 1-10>,
      "observation": "<2-3 sentences>",
      "nextAction": "<one concrete instruction>"
    }
  ]
}

Return ONLY a JSON object matching this shape. Provide exactly three alternatives in headline.alternatives. Provide between 1 and 5 ctas, ordered by importance. No backticks, no markdown, no explanation, no text before or after the JSON.`;

function summarizeDesignScores(scores: DesignScores | null): string {
  if (!scores) return "(design audit not available)";
  return [
    `hero_impact: ${scores.hero_impact?.score ?? "n/a"}/10`,
    `cta_clarity: ${scores.cta_clarity?.score ?? "n/a"}/10`,
    `typography: ${scores.typography?.score ?? "n/a"}/10`,
    `color_discipline: ${scores.color_discipline?.score ?? "n/a"}/10`,
    `mobile_experience: ${scores.mobile_experience?.score ?? "n/a"}/10`,
  ].join(", ");
}

function summarizePositioningScores(scores: PositioningScores | null): string {
  if (!scores) return "(positioning audit not available)";
  return [
    `value_proposition: ${scores.value_proposition?.score ?? "n/a"}/10`,
    `service_clarity: ${scores.service_clarity?.score ?? "n/a"}/10`,
    `social_proof: ${scores.social_proof?.score ?? "n/a"}/10`,
    `contact_accessibility: ${scores.contact_accessibility?.score ?? "n/a"}/10`,
  ].join(", ");
}

function stripDataUriPrefix(dataUri: string): {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
} {
  const m = dataUri.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!m) {
    return { base64: dataUri, mediaType: "image/jpeg" };
  }
  const mediaType = m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  return { base64: m[2]!, mediaType };
}

export async function runPageCritique(params: {
  scanId: string;
  desktopScreenshot: string;
  url: string;
  businessName: string | null;
  industry: string | null;
  city: string | null;
  designScores: DesignScores | null;
  positioningScores: PositioningScores | null;
  performanceScores: PerformanceScores | null;
  heroHasVideo: boolean;
}): Promise<PageCritiqueResult> {
  const {
    scanId,
    desktopScreenshot,
    url,
    businessName,
    industry,
    city,
    designScores,
    positioningScores,
    performanceScores,
    heroHasVideo,
  } = params;

  const desktop = stripDataUriPrefix(desktopScreenshot);

  const userBlocks = [
    {
      type: "text" as const,
      text: `DESKTOP SCREENSHOT (viewport 1440x900):`,
    },
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: desktop.mediaType,
        data: desktop.base64,
      },
    },
    {
      type: "text" as const,
      text: [
        `Site: ${url}`,
        `Business: ${businessName ?? "(not provided)"}`,
        `Industry: ${industry ?? "(not provided)"}`,
        `City: ${city ?? "(not provided)"}`,
        ``,
        `STRUCTURAL SIGNAL FROM CAPTURED PAGE HTML`,
        `heroHasVideo: ${heroHasVideo}`,
        heroHasVideo
          ? `The captured HTML confirms an autoplay <video> element on the page. Real visitors see this video playing in the hero area. The screenshot you are reading may show a dark or empty area where the video sits because headless capture cannot always reproduce the video CDN's serving behavior, codec licensing, or autoplay policy. When you describe the hero in heroObservation, treat that dark/empty area as the intended background video, NOT as "empty space" or "unfinished layout" or a defect to flag. Do NOT generate observations like "the right half is empty" or "the layout feels unfinished" when the dark area is where a video plays for real visitors. Focus your hero observation on what IS visible (hero card content, headline, CTAs, brand mark) and on real composition issues, not on the absence of imagery in this specific capture.`
          : `No autoplay <video> element detected. If the screenshot shows a dark or empty hero area, that absence is real and may be a genuine design issue worth flagging.`,
        ``,
        `EXISTING DESIGN SUB-SCORES (so you do not redundantly call out the same issues):`,
        summarizeDesignScores(designScores),
        ``,
        `EXISTING POSITIONING SUB-SCORES:`,
        summarizePositioningScores(positioningScores),
        ``,
        `PERFORMANCE: overall=${performanceScores?.overall ?? "n/a"}/100`,
        ``,
        `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
      ].join("\n"),
    },
  ];

  return await callClaudeWithJsonSchema(
    "page-critique",
    SYSTEM_PROMPT,
    userBlocks,
    pageCritiqueSchema,
    2500,
    0,
    { operation: "page-critique", scanId },
  );
}
