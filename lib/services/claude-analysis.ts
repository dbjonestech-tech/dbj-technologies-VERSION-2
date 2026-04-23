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

export type IndustryBenchmark = {
  avgDealValue: number;
  dealValueLow: number;
  dealValueHigh: number;
  avgMonthlyVisitors: number;
  visitorsLow: number;
  visitorsHigh: number;
  source: string;
  confidence: "low" | "medium" | "high";
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
  messages: ChatMessage[],
  maxTokens: number = 2048,
  temperature?: number
): Promise<string> {
  const client = getAnthropic();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  try {
    const response = (await client.messages.create(
      {
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: messages as unknown as Parameters<
          typeof client.messages.create
        >[0]["messages"],
        ...(temperature !== undefined && { temperature }),
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
  schema: z.ZodType<T>,
  maxTokens: number = 2048,
  temperature?: number
): Promise<T> {
  const firstResponseText = await callClaude(
    system,
    [{ role: "user", content: initialUserContent }],
    maxTokens,
    temperature
  );

  const firstAttempt = tryParse<T>(firstResponseText, schema);
  if (firstAttempt.ok) return firstAttempt.value;

  const secondResponseText = await callClaude(
    system,
    [
      { role: "user", content: initialUserContent },
      { role: "assistant", content: firstResponseText },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. Respond with ONLY a valid JSON object. No backticks, no explanation, no text before or after the JSON.",
      },
    ],
    maxTokens,
    temperature
  );

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
  methodology: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.object({
    estimatedMonthlyVisitors: z.number().finite().nonnegative(),
    industryAvgConversionRate: z.number().finite().nonnegative().max(0.10),
    avgDealValue: z.number().finite().nonnegative(),
    conversionImprovementEstimate: z.number().finite().nonnegative().max(0.50),
  }),
});

const VISION_SYSTEM_PROMPT = `You are a senior brand and conversion strategist auditing a {{INDUSTRY}} website in {{CITY}}.
The site is {{URL}}{{BUSINESS_NAME}}. Reference the domain and business name naturally in observations when relevant.

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
- IMPORTANT: Screenshots are captured by an automated headless browser and may occasionally show a pre-hydration or partially-loaded state — for example, unstyled text on a blank background, loading skeletons, spinner icons, or a page that appears nearly empty. If a screenshot appears to show a loading or incomplete render state while the EXTRACTED PAGE TEXT section below suggests substantially more content exists (multiple headings, descriptive link texts, a populated meta description), note this discrepancy in your observations and weight your scoring toward the page text evidence rather than heavily penalizing based on an incomplete visual capture. State clearly in the observation when you suspect a screenshot shows a pre-render state. However, if BOTH the screenshot AND the extracted page text show minimal content, score accordingly — that is a genuinely sparse site, not a capture issue.
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

const REMEDIATION_SYSTEM_PROMPT = `You are a senior web strategist producing a prioritized fix list for a {{INDUSTRY}} website in {{CITY}}.
The site is {{URL}}{{BUSINESS_NAME}}. Reference the business name in fix descriptions to make recommendations specific rather than generic.

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
The site is {{URL}}{{BUSINESS_NAME}}. Use the business name in the methodology narrative. Factor the URL domain quality (professional vs. generic, subdomain vs. root) into your confidence assessment.

You will receive the design + positioning scores, the top 3 remediation items, the business industry/city, and Lighthouse performance scores. Produce a DIRECTIONAL, CONSERVATIVE dollar estimate that can be defended by its assumptions.
Lighthouse performance scores are provided. Factor site speed into your revenue model: slow sites (LCP > 4s, poor CLS) lose significantly more visitors than fast ones.

RULES
- Under-estimate rather than over-estimate. When in doubt, round down.
- Base your estimate on clearly-stated assumptions. Show every number that went into the model.
- Assume realistic monthly visitor counts for a small-to-medium local business in this vertical unless there are strong signals otherwise (e.g., national reach evident from the site).
- Use conservative industry-average conversion rates (typical local-business range: 1-3%).
- Use conservative deal values appropriate for the vertical.
- "conversionImprovementEstimate" is the fractional uplift you expect if the top 3 fixes were executed (e.g. 0.3 = 30%). Keep it modest.
- Be explicit in methodology about the fact that this is a model, not a guarantee.

REFERENCE BENCHMARKS (use these as starting points, adjust only with explicit reasoning):

Monthly visitor estimates by business type (single-location, local):
- Auto repair / mechanic shop: 300-500
- Restaurant / café: 500-1000
- Dental / medical practice: 400-700
- Law firm (local): 200-400
- Real estate agent: 300-600
- Home services (plumber, HVAC, electrician): 200-500
- Retail / boutique: 400-800
- Fitness / gym: 300-600
- Salon / barbershop: 300-600
- Construction / contractor: 150-400
- B2B materials / wholesale / supply: 200-350
- If the industry doesn't match above, use 300-500 as default range for local businesses.

Average deal values by business type:
- Auto repair: $150-250 per visit
- Restaurant: $25-50 per visit
- Dental: $200-400 per visit
- Law firm: $1500-5000 per engagement
- Real estate: $5000-15000 per commission
- Home services: $200-500 per job
- Retail: $40-100 per transaction
- Fitness: $50-100 per monthly membership
- Salon: $40-80 per visit
- Construction: $5000-25000 per project
- B2B materials / wholesale / supply: $1,000-2,000 per order
- Default: use $150-300 for unmatched industries.
- For B2B or commercial businesses where individual orders are large but transaction volume is low, use the lower end of the visitor range and the industry-specific deal value. Do NOT use residential consumer deal values for commercial operations.

Conversion rate: always use 2% for local businesses unless there is strong evidence otherwise. Do NOT deviate from 2% without explicit justification in methodology.

Conversion improvement estimate: always use 0.15-0.25 (15-25%) for the top 3 fixes combined. Do NOT exceed 0.30 unless the current site has catastrophic issues (e.g., completely broken mobile, no contact information visible). Use 0.20 as the default.

ALWAYS pick the midpoint of the applicable range. Do NOT pick the low end one scan and the high end the next. Consistency across rescans of the same site is critical — the same site with the same issues should produce the same estimate.

OUTPUT FORMAT
Return ONE JSON object, no markdown, no preamble. Exact shape:
{
  "methodology": "<2-3 sentences explaining your reasoning for each assumption — why this visitor count, why this deal value, why this conversion rate. Do NOT state a final dollar figure for the estimated loss. End with something like 'The estimated loss is derived from these assumptions.'>",
  "confidence": "low" | "medium" | "high",
  "assumptions": {
    "estimatedMonthlyVisitors": <number>,
    "industryAvgConversionRate": <number between 0 and 1>,
    "avgDealValue": <number, dollars>,
    "conversionImprovementEstimate": <number between 0 and 1>
  }
}

CRITICAL: Do NOT include estimatedMonthlyLoss in your JSON — it will be computed server-side from your assumptions. In your methodology text, do NOT state a final dollar figure for the estimated loss or perform the final multiplication. Describe your reasoning for each assumption (why you chose this visitor count, this deal value, this conversion rate, this improvement estimate) but leave the final calculation to the system. This prevents any mismatch between your narrative and the displayed number.`;

function renderPrompt(
  template: string,
  industry: string | null | undefined,
  city: string | null | undefined,
  url: string | null | undefined,
  businessName: string | null | undefined
): string {
  const label = industryLabel(industry);
  const urlText = (url ?? "").trim() || "(unknown)";
  const nameText =
    businessName && businessName.trim().length > 0
      ? ` (${businessName.trim()})`
      : "";
  return template
    .replace(/{{INDUSTRY}}/g, label)
    .replace(/{{CITY}}/g, (city ?? "").trim() || "the local market")
    .replace(/{{URL}}/g, urlText)
    .replace(/{{BUSINESS_NAME}}/g, nameText);
}

type DetectedMediaType = "image/jpeg" | "image/png" | "image/webp";

function detectImageMediaType(base64: string): DetectedMediaType {
  const prefixMatch = base64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  if (prefixMatch) {
    const detected = prefixMatch[1]!.toLowerCase();
    if (detected === "image/png") return "image/png";
    if (detected === "image/webp") return "image/webp";
    if (detected === "image/jpeg" || detected === "image/jpg") return "image/jpeg";
  }

  const clean = base64.replace(/^data:[^;]+;base64,/, "").slice(0, 32);
  try {
    const buf = Buffer.from(clean, "base64");
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buf.length >= 4 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return "image/png";
    }
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return "image/webp";
    }
  } catch {
    /* fall through */
  }
  return "image/jpeg";
}

function stripDataUriPrefix(dataUri: string): {
  base64: string;
  mediaType: DetectedMediaType;
} {
  const mediaType = detectImageMediaType(dataUri);
  const base64 = dataUri.replace(/^data:[^;]+;base64,/, "");
  return { base64, mediaType };
}

type LighthouseAuditFailure = {
  title: string;
  description: string;
  displayValue: string | null;
};

type LighthouseCategoriesExtras = {
  categories?: {
    performance?: { score?: number | null };
    accessibility?: { score?: number | null };
    seo?: { score?: number | null };
    "best-practices"?: { score?: number | null };
  };
  audits?: Record<
    string,
    {
      score?: number | null;
      title?: string | null;
      description?: string | null;
      displayValue?: string | null;
    }
  >;
};

function extractLighthouseAuditDetails(lighthouseData: unknown): {
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  failures: LighthouseAuditFailure[];
} {
  const empty = {
    accessibility: null,
    seo: null,
    bestPractices: null,
    failures: [] as LighthouseAuditFailure[],
  };
  if (!lighthouseData || typeof lighthouseData !== "object") return empty;
  const lh = lighthouseData as LighthouseCategoriesExtras;

  const toScore = (v: number | null | undefined): number | null =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) : null;

  const accessibility = toScore(lh.categories?.accessibility?.score ?? null);
  const seo = toScore(lh.categories?.seo?.score ?? null);
  const bestPractices = toScore(lh.categories?.["best-practices"]?.score ?? null);

  const failures: LighthouseAuditFailure[] = [];
  const audits = lh.audits ?? {};
  for (const [, audit] of Object.entries(audits)) {
    if (!audit || typeof audit !== "object") continue;
    const score = audit.score;
    if (typeof score !== "number" || score >= 0.9) continue;
    const title = typeof audit.title === "string" ? audit.title : null;
    if (!title) continue;
    const description =
      typeof audit.description === "string"
        ? audit.description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        : "";
    failures.push({
      title: truncate(title, 120),
      description: truncate(description, 220),
      displayValue:
        typeof audit.displayValue === "string"
          ? truncate(audit.displayValue, 80)
          : null,
    });
    if (failures.length >= 15) break;
  }

  return { accessibility, seo, bestPractices, failures };
}

function renderLighthouseDetails(
  details: ReturnType<typeof extractLighthouseAuditDetails>
): string {
  const lines: string[] = ["LIGHTHOUSE AUDIT DETAILS"];
  lines.push(
    `Accessibility score: ${details.accessibility !== null ? `${details.accessibility}/100` : "not available at this stage"}`
  );
  lines.push(
    `SEO score: ${details.seo !== null ? `${details.seo}/100` : "not available at this stage"}`
  );
  lines.push(
    `Best practices score: ${details.bestPractices !== null ? `${details.bestPractices}/100` : "not available at this stage"}`
  );
  if (details.failures.length === 0) {
    lines.push("Key audit failures: (none flagged under 0.9)");
  } else {
    lines.push(`Key audit failures (max 15):`);
    for (const f of details.failures) {
      const suffix = f.displayValue ? ` — ${f.displayValue}` : "";
      lines.push(`- ${f.title}${suffix}: ${f.description}`);
    }
  }
  return lines.join("\n");
}

function renderSiteInformation(
  url: string,
  businessName: string | null
): string {
  return [
    `SITE INFORMATION`,
    `URL: ${url}`,
    `Business: ${businessName && businessName.trim().length > 0 ? businessName.trim() : "(not provided)"}`,
  ].join("\n");
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
  pageTextContent: PageTextContent,
  url: string,
  businessName: string | null,
  lighthouseData: unknown
): Promise<VisionAuditResult> {
  const desktop = stripDataUriPrefix(desktopScreenshot);
  const mobile = stripDataUriPrefix(mobileScreenshot);
  const lighthouseDetails = extractLighthouseAuditDetails(lighthouseData);

  const userBlocks: MessageBlock[] = [
    {
      type: "text",
      text: `DESKTOP SCREENSHOT (viewport 1440×900):`,
    },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: desktop.mediaType,
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
        media_type: mobile.mediaType,
        data: mobile.base64,
      },
    },
    {
      type: "text",
      text: [
        renderSiteInformation(url, businessName),
        ``,
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
        renderLighthouseDetails(lighthouseDetails),
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
    renderPrompt(VISION_SYSTEM_PROMPT, industry, city, url, businessName),
    userBlocks,
    visionAuditSchema,
    3000,
    0
  ) as Promise<VisionAuditResult>;
}

function summarizeDesignScores(scores: DesignScores): string {
  return Object.entries(scores)
    .map(
      ([k, v]) =>
        `- ${k}: ${v.score} — ${v.observation.replace(/\s+/g, " ").slice(0, 400)}`
    )
    .join("\n");
}

function summarizePositioningScores(scores: PositioningScores): string {
  return Object.entries(scores)
    .map(
      ([k, v]) =>
        `- ${k}: ${v.score} — ${v.observation.replace(/\s+/g, " ").slice(0, 400)}`
    )
    .join("\n");
}

export async function runRemediationPlan(
  auditResult: VisionAuditResult,
  performanceScores: PerformanceScores,
  industry: string | null,
  city: string | null,
  url: string,
  businessName: string | null
): Promise<RemediationResult> {
  const user = [
    renderSiteInformation(url, businessName),
    ``,
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
    renderPrompt(REMEDIATION_SYSTEM_PROMPT, industry, city, url, businessName),
    user,
    remediationSchema,
    2048,
    0
  ) as Promise<RemediationResult>;
}

export async function researchIndustryBenchmark(
  industry: string | null,
  city: string | null,
  url: string,
  businessName: string | null
): Promise<IndustryBenchmark | null> {
  if (!industry && !businessName && !url) return null;

  const client = getAnthropic();
  const industryLabel = industry?.trim() || "local business";
  const cityLabel = city?.trim() || "United States";
  const bizContext = businessName ? ` (${businessName})` : "";

  const systemPrompt = `You are a market research analyst. Your job is to find the average transaction value (average job ticket, average order value, or average service cost) and typical monthly website visitor count for a specific type of local business.

Search the web for real industry data. Look for:
- Industry reports, trade publications, or benchmark studies
- Average job/ticket/order values for this specific business type
- Typical monthly website traffic for local businesses in this category

Be specific to the business type. A soil brokerage is different from a general contractor. A veterinary clinic is different from a human dentist. A car dealership is different from an auto repair shop.

After researching, respond with ONLY a valid JSON object (no backticks, no markdown, no explanation):
{
  "avgDealValue": <number, the midpoint of the range you found, in dollars>,
  "dealValueLow": <number, low end of typical range>,
  "dealValueHigh": <number, high end of typical range>,
  "avgMonthlyVisitors": <number, estimated monthly website visitors for a single-location business in this category>,
  "visitorsLow": <number, low end>,
  "visitorsHigh": <number, high end>,
  "source": "<brief description of where this data came from, e.g. 'ServiceTitan industry report 2025'>",
  "confidence": "low" | "medium" | "high"
}

Rules:
- avgDealValue means the amount a CUSTOMER pays per transaction/visit/job/order, NOT the business's total revenue
- For service businesses (plumber, HVAC, etc), this is the average service ticket
- For retail, this is the average transaction
- For B2B, this is the average order/contract value
- For subscription businesses, this is the monthly subscription value
- Use the most specific data you can find for this exact business type
- If you find conflicting sources, use the midpoint and note "multiple sources"
- If you cannot find specific data for this exact business type, find the closest comparable industry and note that in source
- Monthly visitors should reflect a SINGLE LOCATION local business website, not a national chain`;

  const userPrompt = `Research the average transaction value and monthly website visitors for this business:
- Business type: ${industryLabel}${bizContext}
- Location: ${cityLabel}
- Website: ${url}

Search for "${industryLabel} average job ticket value" or "${industryLabel} average transaction value" and "${industryLabel} website traffic benchmarks". Find real numbers.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        temperature: 0,
        system: systemPrompt,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
          } as any,
        ],
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const textContent = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    if (!textContent) return null;

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      typeof parsed.avgDealValue !== "number" ||
      typeof parsed.dealValueLow !== "number" ||
      typeof parsed.dealValueHigh !== "number" ||
      typeof parsed.avgMonthlyVisitors !== "number" ||
      !parsed.avgDealValue ||
      !parsed.avgMonthlyVisitors
    ) {
      return null;
    }

    return {
      avgDealValue: Math.round(parsed.avgDealValue),
      dealValueLow: Math.round(parsed.dealValueLow),
      dealValueHigh: Math.round(parsed.dealValueHigh),
      avgMonthlyVisitors: Math.round(parsed.avgMonthlyVisitors),
      visitorsLow: Math.round(parsed.visitorsLow ?? parsed.avgMonthlyVisitors * 0.7),
      visitorsHigh: Math.round(parsed.visitorsHigh ?? parsed.avgMonthlyVisitors * 1.3),
      source: typeof parsed.source === "string" ? parsed.source : "web research",
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
    };
  } catch (err) {
    console.error("[researchIndustryBenchmark] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function runRevenueImpact(
  auditResult: VisionAuditResult,
  remediationPlan: RemediationResult,
  industry: string | null,
  city: string | null,
  url: string,
  businessName: string | null,
  performanceScores: PerformanceScores,
  lighthouseData: unknown,
  benchmark?: IndustryBenchmark | null
): Promise<RevenueImpactResult> {
  const lighthouseDetails = extractLighthouseAuditDetails(lighthouseData);

  const user = [
    renderSiteInformation(url, businessName),
    ``,
    `CONTEXT`,
    `industry: ${industryLabel(industry)}`,
    `city: ${(city ?? "").trim() || "(unspecified)"}`,
    ``,
    `LIGHTHOUSE PERFORMANCE`,
    `Overall: ${performanceScores.overall}/100, LCP: ${performanceScores.lcp}ms, CLS: ${performanceScores.cls}, INP: ${performanceScores.inp}ms, TBT: ${performanceScores.tbt}ms, Speed Index: ${performanceScores.si}ms`,
    ``,
    renderLighthouseDetails(lighthouseDetails),
    ``,
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
    `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
  ].join("\n");

  const benchmarkOverride = benchmark
    ? `\n\nRESEARCHED INDUSTRY BENCHMARK (USE THIS — DO NOT GUESS):
The following deal value and visitor data was researched via web search for this specific business type. Use these numbers directly as your assumptions. Do NOT deviate from these values.
- Researched average deal value: $${benchmark.dealValueLow}–$${benchmark.dealValueHigh} (use midpoint: $${benchmark.avgDealValue})
- Researched monthly website visitors: ${benchmark.visitorsLow}–${benchmark.visitorsHigh} (use midpoint: ${benchmark.avgMonthlyVisitors})
- Data source: ${benchmark.source}
- Research confidence: ${benchmark.confidence}

Set avgDealValue to ${benchmark.avgDealValue}. Set estimatedMonthlyVisitors to ${benchmark.avgMonthlyVisitors}. These are researched values, not estimates.`
    : "";

  const claude = await callClaudeWithJsonSchema(
    "revenue-impact",
    renderPrompt(REVENUE_SYSTEM_PROMPT, industry, city, url, businessName) +
      benchmarkOverride,
    user,
    revenueImpactSchema,
    1500,
    0
  );

  const estimatedMonthlyLoss = Math.round(
    claude.assumptions.estimatedMonthlyVisitors *
      claude.assumptions.industryAvgConversionRate *
      claude.assumptions.avgDealValue *
      claude.assumptions.conversionImprovementEstimate
  );

  return {
    estimatedMonthlyLoss,
    methodology: claude.methodology,
    confidence: claude.confidence,
    assumptions: claude.assumptions,
  } satisfies RevenueImpactResult;
}
