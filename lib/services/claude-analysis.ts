import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  DesignScores,
  PageTextContent,
  PerformanceScores,
  PositioningScores,
  RemediationResult,
  RevenueImpactResult,
  VisionAuditResult,
} from "@/lib/types/scan";

const MODEL = "claude-sonnet-4-6";
const CALL_TIMEOUT_MS = 60_000;
const MAX_HEADINGS = 40;
const MAX_LINK_TEXTS = 40;
const MAX_TEXT_CHARS = 160;

export class ClaudeAnalysisError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ClaudeAnalysisError";
  }
}

type LighthouseAuditDetailItem = Record<string, unknown>;
type LighthouseAuditDetails = {
  items?: LighthouseAuditDetailItem[];
  nodes?: LighthouseAuditDetailItem[];
};
type LighthouseAudit = {
  displayValue?: string;
  details?: LighthouseAuditDetails;
};
type LighthouseResultShape = {
  audits?: Record<string, LighthouseAudit>;
  finalDisplayedUrl?: string;
};

function truncate(s: string, max = MAX_TEXT_CHARS): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function readStringField(item: LighthouseAuditDetailItem, key: string): string | null {
  const v = item[key];
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "text" in v) {
    const t = (v as { text?: unknown }).text;
    if (typeof t === "string") return t;
  }
  return null;
}

export function extractPageTextContent(lighthouseData: unknown): PageTextContent {
  const empty: PageTextContent = {
    title: null,
    metaDescription: null,
    headings: [],
    linkTexts: [],
    structuredData: null,
  };

  if (!lighthouseData || typeof lighthouseData !== "object") return empty;
  const lh = lighthouseData as LighthouseResultShape;
  const audits = lh.audits ?? {};

  const titleRaw =
    audits["document-title"]?.displayValue ??
    (audits["document-title"]?.details?.items?.[0]
      ? readStringField(audits["document-title"].details.items[0]!, "title") ??
        readStringField(audits["document-title"].details.items[0]!, "text")
      : null);

  const metaRaw =
    audits["meta-description"]?.displayValue ??
    (audits["meta-description"]?.details?.items?.[0]
      ? readStringField(audits["meta-description"].details.items[0]!, "description") ??
        readStringField(audits["meta-description"].details.items[0]!, "text")
      : null);

  const headingItems = audits["heading-order"]?.details?.items ?? [];
  const headings: string[] = [];
  for (const item of headingItems) {
    const text = readStringField(item, "text") ?? readStringField(item, "headingText");
    if (text) {
      const clean = truncate(text);
      if (clean) headings.push(clean);
      if (headings.length >= MAX_HEADINGS) break;
    }
  }

  const linkItems = audits["link-text"]?.details?.items ?? [];
  const linkTexts: string[] = [];
  for (const item of linkItems) {
    const text = readStringField(item, "text");
    if (text) {
      const clean = truncate(text);
      if (clean) linkTexts.push(clean);
      if (linkTexts.length >= MAX_LINK_TEXTS) break;
    }
  }

  const structuredAudit =
    audits["structured-data"] ?? audits["json-ld"] ?? audits["structured-data-manual"];
  const structuredData = structuredAudit?.details?.items
    ? structuredAudit.details.items.slice(0, 5)
    : null;

  return {
    title: typeof titleRaw === "string" ? truncate(titleRaw) : null,
    metaDescription: typeof metaRaw === "string" ? truncate(metaRaw, 280) : null,
    headings,
    linkTexts,
    structuredData,
  };
}

function industryLabel(industry: string | null | undefined): string {
  const value = (industry ?? "").trim().toLowerCase();
  if (!value || value === "general") return "small-to-medium local business";
  return industry!.trim();
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json|JSON)?\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

function extractJsonObject(raw: string): string | null {
  const stripped = stripMarkdownFences(raw);
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  return stripped.slice(firstBrace, lastBrace + 1);
}

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeAnalysisError("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey });
}

type MessageBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

type UserMessage = { role: "user"; content: string | MessageBlock[] };
type AssistantMessage = { role: "assistant"; content: string };
type ChatMessage = UserMessage | AssistantMessage;

type TextContentBlock = { type: "text"; text: string };

type AnthropicMessageResponse = {
  content: Array<TextContentBlock | { type: string; [k: string]: unknown }>;
};

async function callClaude(
  system: string,
  messages: ChatMessage[]
): Promise<string> {
  const client = getAnthropic();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  try {
    const response = (await client.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        system,
        messages: messages as unknown as Parameters<
          typeof client.messages.create
        >[0]["messages"],
      },
      { signal: controller.signal }
    )) as unknown as AnthropicMessageResponse;

    const text = response.content
      .filter((b): b is TextContentBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new ClaudeAnalysisError("Claude returned an empty response.");
    }
    return text;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ClaudeAnalysisError("Claude request timed out after 60s.");
    }
    if (err instanceof ClaudeAnalysisError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ClaudeAnalysisError(`Claude API error: ${msg}`, err);
  } finally {
    clearTimeout(timer);
  }
}

async function callClaudeWithJsonSchema<T>(
  label: string,
  system: string,
  initialUserContent: string | MessageBlock[],
  schema: z.ZodType<T>
): Promise<T> {
  const firstResponseText = await callClaude(system, [
    { role: "user", content: initialUserContent },
  ]);

  const firstAttempt = tryParse<T>(firstResponseText, schema);
  if (firstAttempt.ok) return firstAttempt.value;

  const secondResponseText = await callClaude(system, [
    { role: "user", content: initialUserContent },
    { role: "assistant", content: firstResponseText },
    {
      role: "user",
      content:
        "Your previous response was not valid JSON. Respond with ONLY a valid JSON object. No backticks, no explanation, no text before or after the JSON.",
    },
  ]);

  const secondAttempt = tryParse<T>(secondResponseText, schema);
  if (secondAttempt.ok) return secondAttempt.value;

  throw new ClaudeAnalysisError(
    `${label}: could not parse a valid JSON response after one retry. Last error: ${secondAttempt.error}`
  );
}

function tryParse<T>(
  raw: string,
  schema: z.ZodType<T>
): { ok: true; value: T } | { ok: false; error: string } {
  const jsonSlice = extractJsonObject(raw);
  if (!jsonSlice) return { ok: false, error: "No JSON object found in response." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (err) {
    return {
      ok: false,
      error: `JSON.parse failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: `Schema validation failed: ${result.error.message.slice(0, 240)}`,
    };
  }
  return { ok: true, value: result.data };
}

const designMetricSchema = z.object({
  score: z.number().finite(),
  observation: z.string().min(1),
});

const visionAuditSchema = z.object({
  design: z.object({
    hero_impact: designMetricSchema,
    typography: designMetricSchema,
    spacing: designMetricSchema,
    color_discipline: designMetricSchema,
    photography_quality: designMetricSchema,
    cta_clarity: designMetricSchema,
    mobile_experience: designMetricSchema,
    trust_signals: designMetricSchema,
    brand_coherence: designMetricSchema,
  }),
  positioning: z.object({
    value_proposition: designMetricSchema,
    service_clarity: designMetricSchema,
    social_proof: designMetricSchema,
    contact_accessibility: designMetricSchema,
    competitive_differentiation: designMetricSchema,
  }),
});

const remediationSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        problem: z.string().min(1),
        improvement: z.string().min(1),
        impact: z.enum(["high", "medium", "low"]),
        difficulty: z.enum(["easy", "moderate", "hard"]),
      })
    )
    .min(1)
    .max(5),
});

const revenueImpactSchema = z.object({
  estimatedMonthlyLoss: z.number().finite().nonnegative(),
  methodology: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.object({
    estimatedMonthlyVisitors: z.number().finite().nonnegative(),
    industryAvgConversionRate: z.number().finite().nonnegative(),
    avgDealValue: z.number().finite().nonnegative(),
    conversionImprovementEstimate: z.number().finite().nonnegative(),
  }),
});

const VISION_SYSTEM_PROMPT = `You are a senior brand and conversion strategist auditing a {{INDUSTRY}} website in {{CITY}}.

Your job is to analyze two screenshots (desktop and mobile home page) and the supporting page text, and output a strictly-scored audit. You are opinionated, concrete, and conservative: when evidence is weak, score lower, not higher.

SCORING RUBRIC — DESIGN (total max 100)
- hero_impact (0-10): Does above-the-fold communicate what the business does and why to choose it within 3 seconds?
- typography (0-10): Hierarchy, pairing, readability, professional feel.
- spacing (0-10): White space, consistent margins, visual breathing room.
- color_discipline (0-10): Restrained palette, coherent with the industry.
- photography_quality (0-15): Original/professional imagery vs stock or amateur photos.
- cta_clarity (0-10): Is the primary action obvious, singular, and well-positioned?
- mobile_experience (0-15): Does mobile feel intentional rather than a desktop afterthought?
- trust_signals (0-10): Credentials, reviews, badges, associations visible.
- brand_coherence (0-10): Everything feels like one brand vs assembled template parts.

SCORING RUBRIC — POSITIONING (each 0-10)
- value_proposition: Is there a clear, unique reason to choose this business?
- service_clarity: Are offerings, service area, and specialties clearly stated?
- social_proof: Testimonials, reviews, case studies, client logos visible?
- contact_accessibility: Is it obvious how to reach the business (phone, form, chat)?
- competitive_differentiation: What makes them different from direct competitors?

GUIDELINES
- Each sub-score must include a 1-2 sentence observation grounded in what you actually see in the screenshots or read in the page text.
- Do NOT hallucinate elements that are not visible. If something cannot be judged from the screenshots and page text, score it conservatively and say so in the observation.
- Observations should be concrete (reference specific elements, colors, layout choices, phrases) — not generic.
- Tone: honest, actionable, respectful. No marketing fluff.

OUTPUT FORMAT
Return ONE JSON object, no markdown, no preamble. Exact shape:
{
  "design": {
    "hero_impact": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "typography": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "spacing": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "color_discipline": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "photography_quality": { "score": <number 0-15>, "observation": "<1-2 sentences>" },
    "cta_clarity": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "mobile_experience": { "score": <number 0-15>, "observation": "<1-2 sentences>" },
    "trust_signals": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "brand_coherence": { "score": <number 0-10>, "observation": "<1-2 sentences>" }
  },
  "positioning": {
    "value_proposition": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "service_clarity": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "social_proof": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "contact_accessibility": { "score": <number 0-10>, "observation": "<1-2 sentences>" },
    "competitive_differentiation": { "score": <number 0-10>, "observation": "<1-2 sentences>" }
  }
}`;

const REMEDIATION_SYSTEM_PROMPT = `You are a senior web strategist producing a prioritized fix list for a {{INDUSTRY}} website.

You will receive the design scores, positioning scores, and Lighthouse performance metrics. Return exactly 3 fixes, ordered by impact (high → low), respecting sensible dependencies: fix structural or imagery issues before tweaking CTA copy; fix performance blockers before layering new marketing features.

For each item:
- title: Short imperative phrase describing the fix.
- problem: 1-2 sentences describing what is wrong today, grounded in the provided scores and observations.
- improvement: 1-2 sentences describing what the site gains once this is fixed (business outcome, not a code change).
- impact: "high" | "medium" | "low" (must be declining or equal across the 3 items).
- difficulty: "easy" | "moderate" | "hard" — honest assessment of the effort for a small business to execute.

OUTPUT FORMAT
Return ONE JSON object, no markdown, no preamble. Exact shape:
{
  "items": [
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" },
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" },
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" }
  ]
}`;

const REVENUE_SYSTEM_PROMPT = `You are a conservative revenue analyst estimating the monthly revenue a {{INDUSTRY}} website in {{CITY}} is leaving on the table due to the issues identified in the audit.

You will receive the design + positioning scores, the top 3 remediation items, and the business industry/city. Produce a DIRECTIONAL, CONSERVATIVE dollar estimate that can be defended by its assumptions.

RULES
- Under-estimate rather than over-estimate. When in doubt, round down.
- Base your estimate on clearly-stated assumptions. Show every number that went into the model.
- Assume realistic monthly visitor counts for a small-to-medium local business in this vertical unless there are strong signals otherwise (e.g., national reach evident from the site).
- Use conservative industry-average conversion rates (typical local-business range: 1-3%).
- Use conservative deal values appropriate for the vertical.
- "conversionImprovementEstimate" is the fractional uplift you expect if the top 3 fixes were executed (e.g. 0.3 = 30%). Keep it modest.
- Be explicit in methodology about the fact that this is a model, not a guarantee.

OUTPUT FORMAT
Return ONE JSON object, no markdown, no preamble. Exact shape:
{
  "estimatedMonthlyLoss": <number, whole dollars>,
  "methodology": "<2-3 sentences explaining how you derived this>",
  "confidence": "low" | "medium" | "high",
  "assumptions": {
    "estimatedMonthlyVisitors": <number>,
    "industryAvgConversionRate": <number between 0 and 1>,
    "avgDealValue": <number, dollars>,
    "conversionImprovementEstimate": <number between 0 and 1>
  }
}`;

function renderPrompt(
  template: string,
  industry: string | null | undefined,
  city: string | null | undefined
): string {
  const label = industryLabel(industry);
  return template
    .replace(/{{INDUSTRY}}/g, label)
    .replace(/{{CITY}}/g, (city ?? "").trim() || "the local market");
}

function stripDataUriPrefix(dataUri: string): { base64: string; mediaType: string } {
  const match = dataUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return { mediaType: match[1]!, base64: match[2]! };
  }
  // If no prefix present, assume caller already stripped it; default to jpeg.
  return { mediaType: "image/jpeg", base64: dataUri };
}

function summarizePageText(content: PageTextContent): string {
  const lines: string[] = [];
  lines.push(`title: ${content.title ?? "(none detected)"}`);
  lines.push(`metaDescription: ${content.metaDescription ?? "(none detected)"}`);
  lines.push(
    `headings (${content.headings.length}): ${
      content.headings.length
        ? content.headings.slice(0, 20).map((h) => `- ${h}`).join("\n")
        : "(none detected)"
    }`
  );
  lines.push(
    `linkTexts (${content.linkTexts.length}): ${
      content.linkTexts.length
        ? content.linkTexts.slice(0, 20).join(" | ")
        : "(none detected)"
    }`
  );
  lines.push(
    `structuredData: ${
      content.structuredData ? "present" : "not detected"
    }`
  );
  return lines.join("\n");
}

export async function runVisionAudit(
  desktopScreenshot: string,
  mobileScreenshot: string,
  industry: string | null,
  city: string | null,
  performanceScores: PerformanceScores,
  pageTextContent: PageTextContent
): Promise<VisionAuditResult> {
  const desktop = stripDataUriPrefix(desktopScreenshot);
  const mobile = stripDataUriPrefix(mobileScreenshot);

  const userBlocks: MessageBlock[] = [
    {
      type: "text",
      text: `DESKTOP SCREENSHOT (viewport 1440×900):`,
    },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: desktop.base64,
      },
    },
    {
      type: "text",
      text: `MOBILE SCREENSHOT (viewport 375×812):`,
    },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: mobile.base64,
      },
    },
    {
      type: "text",
      text: [
        `BUSINESS CONTEXT`,
        `industry: ${industryLabel(industry)}`,
        `city: ${(city ?? "").trim() || "(unspecified)"}`,
        ``,
        `LIGHTHOUSE PERFORMANCE SCORES`,
        `overall: ${performanceScores.overall}/100`,
        `LCP: ${performanceScores.lcp}ms`,
        `CLS: ${performanceScores.cls}`,
        `INP: ${performanceScores.inp}ms`,
        `TBT: ${performanceScores.tbt}ms`,
        `Speed Index: ${performanceScores.si}ms`,
        ``,
        `EXTRACTED PAGE TEXT`,
        summarizePageText(pageTextContent),
        ``,
        `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
      ].join("\n"),
    },
  ];

  return callClaudeWithJsonSchema(
    "vision-audit",
    renderPrompt(VISION_SYSTEM_PROMPT, industry, city),
    userBlocks,
    visionAuditSchema
  ) as Promise<VisionAuditResult>;
}

function summarizeDesignScores(scores: DesignScores): string {
  return Object.entries(scores)
    .map(
      ([k, v]) =>
        `- ${k}: ${v.score} — ${v.observation.replace(/\s+/g, " ").slice(0, 240)}`
    )
    .join("\n");
}

function summarizePositioningScores(scores: PositioningScores): string {
  return Object.entries(scores)
    .map(
      ([k, v]) =>
        `- ${k}: ${v.score} — ${v.observation.replace(/\s+/g, " ").slice(0, 240)}`
    )
    .join("\n");
}

export async function runRemediationPlan(
  auditResult: VisionAuditResult,
  performanceScores: PerformanceScores,
  industry: string | null
): Promise<RemediationResult> {
  const user = [
    `DESIGN SCORES`,
    summarizeDesignScores(auditResult.design),
    ``,
    `POSITIONING SCORES`,
    summarizePositioningScores(auditResult.positioning),
    ``,
    `LIGHTHOUSE PERFORMANCE`,
    `overall: ${performanceScores.overall}/100`,
    `LCP: ${performanceScores.lcp}ms  CLS: ${performanceScores.cls}  INP: ${performanceScores.inp}ms  TBT: ${performanceScores.tbt}ms  SI: ${performanceScores.si}ms`,
    ``,
    `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
  ].join("\n");

  return callClaudeWithJsonSchema(
    "remediation-plan",
    renderPrompt(REMEDIATION_SYSTEM_PROMPT, industry, null),
    user,
    remediationSchema
  ) as Promise<RemediationResult>;
}

export async function runRevenueImpact(
  auditResult: VisionAuditResult,
  remediationPlan: RemediationResult,
  industry: string | null,
  city: string | null
): Promise<RevenueImpactResult> {
  const user = [
    `DESIGN SCORES`,
    summarizeDesignScores(auditResult.design),
    ``,
    `POSITIONING SCORES`,
    summarizePositioningScores(auditResult.positioning),
    ``,
    `TOP 3 REMEDIATION ITEMS`,
    remediationPlan.items
      .map(
        (it, i) =>
          `${i + 1}. ${it.title} (impact=${it.impact}, difficulty=${it.difficulty})\n   problem: ${it.problem}\n   improvement: ${it.improvement}`
      )
      .join("\n"),
    ``,
    `CONTEXT`,
    `industry: ${industryLabel(industry)}`,
    `city: ${(city ?? "").trim() || "(unspecified)"}`,
    ``,
    `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
  ].join("\n");

  return callClaudeWithJsonSchema(
    "revenue-impact",
    renderPrompt(REVENUE_SYSTEM_PROMPT, industry, city),
    user,
    revenueImpactSchema
  ) as Promise<RevenueImpactResult>;
}
