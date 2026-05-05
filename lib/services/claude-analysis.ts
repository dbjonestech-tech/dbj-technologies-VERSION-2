import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  InternalServerError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  DesignScores,
  IndustryBenchmark,
  PageTextContent,
  PerformanceScores,
  PositioningScores,
  RemediationResult,
  RevenueImpactResult,
  VisionAuditResult,
} from "@/lib/types/scan";
import {
  recordAnthropicUsage,
  type ApiCallStatus,
} from "./api-usage";

const MODEL = "claude-sonnet-4-6";

export type AnthropicCallMeta = {
  operation: string;
  scanId: string | null;
};
const CALL_TIMEOUT_MS = 90_000;
// revenue-impact assembles the longest user prompt (vision findings +
// remediation summary + benchmark JSON + assumptions) and routinely
// pushes 60-80s end to end. Five recent partial scans hit our own 90s
// AbortController on this stage, so it gets a longer budget. Inngest's
// per-step ceiling is well above 120s.
const REVENUE_CALL_TIMEOUT_MS = 120_000;
// Stage 2 forms-audit is a small text-only call (~3KB input, ~1.5KB
// output) that runs as a post-finalize side-step. Capping it at 30s
// keeps the worst-case retry cascade well under the function-level
// 420s ceiling so a stuck forms-audit cannot block the report email.
const FORMS_AUDIT_CALL_TIMEOUT_MS = 30_000;
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

/* Patterns that indicate a captured-by-headless-only artifact, not a real
 * site defect. Lighthouse runs its own headless Chrome which trips the same
 * MediaElement.js / Wix CDN failures we see in our screenshot capture, so
 * its text-extraction audits (heading-order, link-text) end up carrying
 * "Format(s) not supported", "Download File: <video URL>", and similar
 * strings into pageTextContent. Without this filter the vision audit sees
 * those strings even when our own screenshot is clean, and dutifully
 * generates a "your hero video is broken" finding against a defect that
 * does not exist on the live site.
 *
 * These patterns are intentionally specific. Genuine product copy that
 * happens to mention "video" or "download" is left untouched. */
const VIDEO_ARTIFACT_PATTERNS: ReadonlyArray<RegExp> = [
  /format\(s\)\s+not\s+supported/i,
  /source\(s\)\s+not\s+found/i,
  /your\s+browser\s+does\s+not\s+support/i,
  /\bmedia\s+error\b/i,
  /\bcannot\s*play\b/i,
  /\bdownload\s+file\b.*\.(mp4|webm|mov|m4v|ogv)\b/i,
  /\.(mp4|webm|mov|m4v|ogv)(\?|$|\s)/i,
];

function isVideoArtifact(text: string): boolean {
  return VIDEO_ARTIFACT_PATTERNS.some((p) => p.test(text));
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
      if (clean && !isVideoArtifact(clean)) headings.push(clean);
      if (headings.length >= MAX_HEADINGS) break;
    }
  }

  const linkItems = audits["link-text"]?.details?.items ?? [];
  const linkTexts: string[] = [];
  for (const item of linkItems) {
    const text = readStringField(item, "text");
    if (text) {
      const clean = truncate(text);
      if (clean && !isVideoArtifact(clean)) linkTexts.push(clean);
      if (linkTexts.length >= MAX_LINK_TEXTS) break;
    }
  }

  const structuredAudit =
    audits["structured-data"] ?? audits["json-ld"] ?? audits["structured-data-manual"];
  const structuredData = structuredAudit?.details?.items
    ? structuredAudit.details.items.slice(0, 5)
    : null;

  /* Title and metaDescription are ALSO sanitized: a few site builders
   * occasionally leak the broken-media fallback into the document title
   * when their template's <title> binds to a JS-derived value. */
  const titleClean =
    typeof titleRaw === "string" ? truncate(titleRaw) : null;
  const metaClean =
    typeof metaRaw === "string" ? truncate(metaRaw, 280) : null;

  return {
    title: titleClean && !isVideoArtifact(titleClean) ? titleClean : null,
    metaDescription:
      metaClean && !isVideoArtifact(metaClean) ? metaClean : null,
    headings,
    linkTexts,
    structuredData,
  };
}

function industryLabel(industry: string | null | undefined): string {
  const value = (industry ?? "").trim().toLowerCase();
  // When no industry was supplied, stay neutral instead of pre-biasing the
  // prompt toward "small local business". The vision audit infers vertical,
  // businessModel, and businessScale on its own.
  if (!value || value === "general") return "business website";
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

const RETRY_DELAYS_MS = [15_000, 30_000];

// Thrown when our own AbortController's timer fires. Distinguishes a
// timeout-driven abort from a true upstream APIUserAbortError (which
// would mean the caller cancelled). The classifier below treats this
// as transient so callWithRetry will give the request another shot.
class ClaudeCallTimeoutError extends Error {
  constructor(operation: string, ms: number) {
    super(`Claude API call '${operation}' timed out after ${ms / 1000}s`);
    this.name = "ClaudeCallTimeoutError";
  }
}

function isTransientAnthropicError(err: unknown): boolean {
  if (err instanceof ClaudeCallTimeoutError) return true;
  if (err instanceof APIUserAbortError) return false;
  if (err instanceof APIConnectionError) return true;
  if (err instanceof RateLimitError) return true;
  if (err instanceof InternalServerError) return true;
  if (err instanceof APIError) {
    const status = err.status;
    if (typeof status === "number" && (status >= 500 || status === 429)) {
      return true;
    }
  }
  return false;
}

function describeRetryError(err: unknown): string {
  if (err instanceof APIError) {
    return `${err.constructor.name} status=${err.status ?? "n/a"} type=${err.type ?? "n/a"}`;
  }
  if (err instanceof Error) {
    return `${err.name}: ${err.message.slice(0, 140)}`;
  }
  return String(err);
}

async function callWithRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const maxAttempts = 1 + RETRY_DELAYS_MS.length;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isTransientAnthropicError(err)) {
        throw err;
      }
      const delay = RETRY_DELAYS_MS[attempt - 1]!;
      console.warn(
        `[${label}] transient Anthropic error on attempt ${attempt}/${maxAttempts} (${describeRetryError(err)}); retrying in ${delay / 1000}s`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
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

// Anthropic prompt caching threshold: only wrap system prompts in a
// cache_control block when they are large enough that the cache hit
// outweighs the per-write overhead. Below ~1024 tokens (~4000 chars at
// 4 chars/token) caching is not worth the complexity.
const CACHE_MIN_CHARS = 4000;

function buildCacheableSystem(system: string): string | unknown[] {
  if (system.length < CACHE_MIN_CHARS) return system;
  return [
    {
      type: "text",
      text: system,
      cache_control: { type: "ephemeral" },
    },
  ];
}

async function callClaude(
  system: string,
  messages: ChatMessage[],
  maxTokens: number = 2048,
  temperature?: number,
  meta?: AnthropicCallMeta
): Promise<string> {
  const client = getAnthropic();
  const operation = meta?.operation ?? "claude-call";
  const scanId = meta?.scanId ?? null;
  const callTimeoutMs =
    operation === "revenue-impact"
      ? REVENUE_CALL_TIMEOUT_MS
      : operation === "forms-audit"
        ? FORMS_AUDIT_CALL_TIMEOUT_MS
        : CALL_TIMEOUT_MS;
  let attempt = 0;

  try {
    const response = await callWithRetry("callClaude", async () => {
      attempt += 1;
      const start = Date.now();
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, callTimeoutMs);
      try {
        const apiResp = (await client.messages.create(
          {
            model: MODEL,
            max_tokens: maxTokens,
            system: buildCacheableSystem(system) as unknown as Parameters<
              typeof client.messages.create
            >[0]["system"],
            messages: messages as unknown as Parameters<
              typeof client.messages.create
            >[0]["messages"],
            ...(temperature !== undefined && { temperature }),
          },
          { signal: controller.signal }
        )) as unknown as AnthropicMessageResponse & {
          usage?: {
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
          };
        };
        await recordAnthropicUsage({
          scanId,
          operation,
          model: MODEL,
          durationMs: Date.now() - start,
          status: "ok",
          attempt,
          usage: apiResp.usage ?? null,
        });
        return apiResp;
      } catch (err) {
        // If our own timer fired, the SDK throws APIUserAbortError. Re-cast
        // it so callWithRetry treats it as transient and retries. A real
        // upstream cancellation (timedOut=false) still propagates as fatal.
        const normalized =
          timedOut && err instanceof APIUserAbortError
            ? new ClaudeCallTimeoutError(operation, callTimeoutMs)
            : err;
        const status: ApiCallStatus = isTransientAnthropicError(normalized)
          ? "retry"
          : "fail";
        await recordAnthropicUsage({
          scanId,
          operation,
          model: MODEL,
          durationMs: Date.now() - start,
          status,
          attempt,
          usage: null,
        });
        throw normalized;
      } finally {
        clearTimeout(timer);
      }
    });

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
  }
}

export async function callClaudeWithJsonSchema<T>(
  label: string,
  system: string,
  initialUserContent: string | MessageBlock[],
  schema: z.ZodType<T>,
  maxTokens: number = 2048,
  temperature?: number,
  meta?: AnthropicCallMeta
): Promise<T> {
  const firstResponseText = await callClaude(
    system,
    [{ role: "user", content: initialUserContent }],
    maxTokens,
    temperature,
    meta
  );

  const firstAttempt = tryParse<T>(firstResponseText, schema);
  if (firstAttempt.ok) return firstAttempt.value;

  /* Repair prompt threads the SPECIFIC parse/validation error back to
     Claude so the second attempt can target the actual problem (e.g.
     "expected string at .industry, received null"). The previous
     generic "respond with only JSON" message lost the error detail
     and produced the same shape of failure on retry, which was the
     dominant remaining trigger of the report-page partial banner. */
  const secondResponseText = await callClaude(
    system,
    [
      { role: "user", content: initialUserContent },
      { role: "assistant", content: firstResponseText },
      {
        role: "user",
        content:
          `Your previous response failed parsing or schema validation: ${firstAttempt.error}\n\n` +
          "Respond with ONLY a valid JSON object that matches the schema described in the system prompt. " +
          "Fix the specific issue identified above. No backticks, no explanation, no text before or after the JSON.",
      },
    ],
    maxTokens,
    temperature,
    meta
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
  businessModel: z
    .enum(["B2B", "B2C", "mixed"])
    .optional()
    .default("B2C")
    .describe(
      "Primary business model visible from the website. B2B = sells to other businesses (contractors, agencies, wholesalers, SaaS platforms). B2C = sells directly to individual consumers. Mixed = clearly serves both."
    ),
  inferredVertical: z
    .string()
    .optional()
    .default("general")
    .describe(
      "The specific business vertical inferred from visible content. Be as specific as possible. Examples: 'commercial soil brokerage', 'residential plumbing', 'personal injury law firm', 'SaaS project management', 'fine dining restaurant', 'mobile dog grooming'. Do NOT use generic labels like 'services' or 'business'."
    ),
  inferredVerticalParent: z
    .string()
    .optional()
    .default("Other")
    .describe(
      "The broad parent category. One of: 'Home Services & Trades', 'Automotive', 'Health & Wellness', 'Legal', 'Financial Services', 'Food & Beverage', 'Professional Services / B2B', 'Retail & E-Commerce', 'Real Estate', 'Education & Childcare', 'Beauty & Personal Care', 'Technology / SaaS', 'Construction & Materials', 'Fitness & Recreation', 'Pet Services', 'Events & Entertainment', 'Travel & Hospitality', 'Agriculture & Landscaping', 'Nonprofit', 'Other'."
    ),
  businessScale: z
    .enum(["single-location", "regional", "national", "global"])
    .optional()
    .default("single-location")
    .describe(
      "Operational footprint. single-location = one storefront or service area. regional = multiple locations within a state or metro. national = household-name brand operating across most of a country (e.g. Whole Foods, Walmart, Target). global = multinational megabrand (e.g. Google, Amazon, Apple, Microsoft)."
    ),
  screenshotHealth: z
    .enum([
      "clean",
      "cookie-banner-overlay",
      "loading-or-skeleton",
      "auth-wall",
      "minimal-content",
    ])
    .optional()
    .default("clean")
    .describe(
      "What the screenshot actually shows. clean = real homepage content visible. cookie-banner-overlay = a consent or privacy modal covers most of the page. loading-or-skeleton = pre-hydration spinners or skeleton placeholders. auth-wall = login, signup, or paywall is the dominant content. minimal-content = the page rendered but is genuinely sparse (likely a placeholder or under-construction site)."
    ),
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

const VISION_SYSTEM_PROMPT = `You are a senior brand and conversion strategist. The user message will provide the site URL, business name, industry, city, and other context. Reference the domain and business name naturally in observations when relevant.

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

READ THE PAGE AS A COMPOSITION, NOT AS ISOLATED ELEMENTS. The visitor's understanding of "what is this business" is built from at least three layers stacked together: (a) the navigation brand mark plus any tagline next to it (e.g. "Wingert | Real Estate Company"), (b) the hero headline, subline, and supporting copy, and (c) the visible CTAs and any trust indicators. Score value_proposition, service_clarity, and brand_coherence based on what the COMPOSITION communicates to the visitor, not what any single element communicates in isolation. If the nav brand mark already names the company plus the category and the hero subline reinforces or completes that category statement, do not penalize service_clarity for "the page never says what they do" -- the page is saying it across two surfaces. Conversely, if the hero alone is doing the work and the nav offers no support, factor that asymmetry into your observation.

A NOTE ON BACKGROUND VIDEO AND ANIMATED HEROES: many sites place a hero card on top of a looping background video showing their work, their city, or their products. The screenshot captured one frame of that video. Do NOT classify the page as broken or low-confidence simply because of imagery behind a hero card; that is the intended composition. Only treat a hero as broken if the screenshot literally shows an error string like "Format(s) not supported" or "source not found" overlaid on the page in a way no real visitor would see, AND the page text gives no other signal the imagery is intentional. When in doubt, score what you see and note your interpretation in the observation rather than penalizing the design for ambiguity.

BUSINESS MODEL CLASSIFICATION:
Determine the business model from visible website content:
- B2B: Look for indicators like "contractors", "enterprise", "wholesale", "fleet", "commercial", bulk pricing, RFQ forms, industry jargon, no consumer-facing shopping cart.
- B2C: Look for consumer language, individual pricing, shopping carts, "book now" for personal services, residential imagery.
- Mixed: Clear evidence of both (e.g., "residential and commercial" in headline).

VERTICAL CLASSIFICATION:
Identify the specific business vertical from the homepage content. Use the most specific label supported by visible evidence. Do not guess beyond what the site content shows. If the site says "soil brokerage serving contractors across DFW," the vertical is "commercial soil brokerage," NOT "landscaping" or "construction."

For inferredVerticalParent, use exactly one of these categories: Home Services & Trades, Automotive, Health & Wellness, Legal, Financial Services, Food & Beverage, Professional Services / B2B, Retail & E-Commerce, Real Estate, Education & Childcare, Beauty & Personal Care, Technology / SaaS, Construction & Materials, Fitness & Recreation, Pet Services, Events & Entertainment, Travel & Hospitality, Agriculture & Landscaping, Nonprofit, Other.

BUSINESS SCALE CLASSIFICATION:
Determine the operational footprint visible from the website and the URL/domain. This drives whether revenue estimates are even meaningful, since Pathlight is calibrated for small and regional businesses, not multinational brands.
- single-location: one storefront, office, or service area. Local family business.
- regional: a chain or service business with multiple locations within a state or metro area.
- national: household-name brand operating across most of a country. Examples: Whole Foods, Walmart, Target, Home Depot, Chipotle, Best Buy, Marriott, Starbucks.
- global: multinational megabrand with worldwide presence. Examples: Google, Amazon, Apple, Microsoft, Meta, Netflix, Coca-Cola, Nike.

Be honest. If the URL is a known megabrand (e.g. google.com, amazon.com, wholefoodsmarket.com, walmart.com, apple.com), classify as national or global even if the homepage looks simple. Default to single-location only when there is clear evidence of a small local operation.

SCREENSHOT HEALTH:
Before scoring anything else, decide what the screenshot actually shows. The audit is meaningless if the capture is dominated by a cookie consent dialog, a login wall, or a true loading skeleton. But a sparse-but-rendered page is NOT a capture problem. It is a real design choice the design sub-scores already capture (low hero_impact, low spacing, low photography_quality). Default to "clean" unless you can point to a concrete loading indicator.
- clean: the page is rendered. Hero text, buttons, navigation, and any brand logo are visible and styled. This is the right classification even when the page is sparse, broken, or under-designed; those are real findings, not capture issues. Use this as the default.
- cookie-banner-overlay: a GDPR/CCPA consent or privacy modal covers most of the page. Score conservatively and call this out.
- loading-or-skeleton: the screenshot shows literal in-progress rendering. Required evidence is at least one of: a visible spinner icon, gray skeleton placeholder boxes, an explicit "Loading..." or "Please wait" message, or completely unstyled raw HTML with no CSS applied. A small hero on a large empty background, or a hero with a broken media element showing an error overlay, is NOT a loading state.
- auth-wall: login, signup, or paywall is the dominant content. The user pasted a URL that requires authentication.
- minimal-content: the page rendered fully but is genuinely sparse (placeholder, under-construction, or coming-soon).
When health is anything other than clean, lower confidence in your scores and mention the issue in the relevant observations.

GUIDELINES
- Each sub-score must include a 1-2 sentence observation grounded in what you actually see in the screenshots or read in the page text.
- Do NOT hallucinate elements that are not visible. If something cannot be judged from the screenshots and page text, score it conservatively and say so in the observation.
- IMPORTANT: Headless-browser captures occasionally catch a true mid-render state, such as a visible spinner icon, gray skeleton boxes, an explicit "Loading..." message, or completely unstyled raw HTML. Those are unambiguous signals. Flag screenshotHealth as "loading-or-skeleton" ONLY when one of those is actually visible in the screenshot. A sparse-but-styled page (small hero on a large empty background, broken media elements showing error overlays, a page that just looks under-designed) is the site's real rendered output, not a capture issue. Score the design sub-scores accordingly and call out the specific defect (failed video element, low hero_impact, excessive negative space) in the matching observation. If a screenshot does show a true skeleton state while the EXTRACTED PAGE TEXT below suggests substantially more content exists, weight your scoring toward the page text evidence and note the discrepancy in your observations.
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
  },
  "businessModel": "B2B" | "B2C" | "mixed",
  "inferredVertical": "<specific vertical label>",
  "inferredVerticalParent": "<one of the parent categories listed above>",
  "businessScale": "single-location" | "regional" | "national" | "global",
  "screenshotHealth": "clean" | "cookie-banner-overlay" | "loading-or-skeleton" | "auth-wall" | "minimal-content"
}`;

const REMEDIATION_SYSTEM_PROMPT = `You are a senior web strategist producing a prioritized fix list for a website. The user message will provide the site URL, business name, industry, city, design + positioning scores, and Lighthouse performance metrics. Reference the business name in fix descriptions to make recommendations specific rather than generic.

You will receive the design scores, positioning scores, and Lighthouse performance metrics. Return exactly 3 fixes, ordered by impact (high → low), respecting sensible dependencies: fix structural or imagery issues before tweaking CTA copy; fix performance blockers before layering new marketing features.

For each item:
- title: Short imperative phrase describing the fix.
- problem: 1-2 sentences describing what is wrong today, grounded in the provided scores and observations.
- improvement: 1-2 sentences describing what the site gains once this is fixed (business outcome, not a code change).
- impact: "high" | "medium" | "low" (must be declining or equal across the 3 items).
- difficulty: "easy" | "moderate" | "hard" (honest assessment of the effort for a small business to execute).

QUALITY RULES (do not violate):
- Ground every recommendation in a SPECIFIC sub-score that is below 7/10 or in a Lighthouse failure listed above. Cite the metric in the problem field.
- Do NOT recommend improvements to areas already scoring 8 or higher. If hero_impact is 9, do not propose hero changes; pick a weaker area.
- Do NOT produce generic copy like "improve your CTA" or "add testimonials" without referencing what specifically is broken on this site (use observations from the scores). If you cannot tie a recommendation to a concrete observation, omit that item and return fewer than 3 fixes.
- If fewer than 3 sub-scores are below 7, return only as many remediation items as there are real problems. The schema accepts 1-5 items; do not pad to reach 3 if the site is genuinely strong.

OUTPUT FORMAT
Return ONE JSON object, no markdown, no preamble. Exact shape:
{
  "items": [
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" },
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" },
    { "title": "...", "problem": "...", "improvement": "...", "impact": "high" | "medium" | "low", "difficulty": "easy" | "moderate" | "hard" }
  ]
}`;

const REVENUE_SYSTEM_PROMPT = `You are a conservative revenue analyst estimating the monthly revenue a website is leaving on the table due to issues identified in the audit. The user message will provide the site URL, business name, industry, city, performance scores, design + positioning scores, the top 3 remediation items, and (when available) industry benchmark data. Use the business name in the methodology narrative. Factor the URL domain quality (professional vs. generic, subdomain vs. root) into your confidence assessment.

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
  desktopScreenshot: string | null,
  mobileScreenshot: string | null,
  industry: string | null,
  city: string | null,
  performanceScores: PerformanceScores,
  pageTextContent: PageTextContent,
  url: string,
  businessName: string | null,
  lighthouseData: unknown,
  scanId: string | null = null
): Promise<VisionAuditResult> {
  /* At least one viewport is required; the inngest a1 gate enforces this
   * but defend in depth in case a future caller skips the check. */
  if (!desktopScreenshot && !mobileScreenshot) {
    throw new Error(
      "runVisionAudit requires at least one screenshot (desktop or mobile)."
    );
  }
  const desktop = desktopScreenshot ? stripDataUriPrefix(desktopScreenshot) : null;
  const mobile = mobileScreenshot ? stripDataUriPrefix(mobileScreenshot) : null;
  const lighthouseDetails = extractLighthouseAuditDetails(lighthouseData);

  const userBlocks: MessageBlock[] = [];
  if (desktop) {
    userBlocks.push({
      type: "text",
      text: `DESKTOP SCREENSHOT (viewport 1440×900):`,
    });
    userBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: desktop.mediaType,
        data: desktop.base64,
      },
    });
  } else {
    userBlocks.push({
      type: "text",
      text:
        `DESKTOP SCREENSHOT: unavailable for this scan. Score design.mobile_experience and other viewport-specific findings from responsive cues in the mobile screenshot and the Lighthouse signals below; do not penalize design for the missing image.`,
    });
  }
  if (mobile) {
    userBlocks.push({
      type: "text",
      text: `MOBILE SCREENSHOT (viewport 375×812):`,
    });
    userBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mobile.mediaType,
        data: mobile.base64,
      },
    });
  } else {
    userBlocks.push({
      type: "text",
      text:
        `MOBILE SCREENSHOT: unavailable for this scan. Score design.mobile_experience from responsive design cues visible in the desktop screenshot (breakpoints, fluid layout, touch-target sizing) plus the Lighthouse mobile performance signals below; do not penalize design for the missing image.`,
    });
  }
  userBlocks.push({
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
  });

  return callClaudeWithJsonSchema(
    "vision-audit",
    renderPrompt(VISION_SYSTEM_PROMPT, industry, city, url, businessName),
    userBlocks,
    visionAuditSchema,
    3000,
    0,
    { operation: "vision-audit", scanId }
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
  businessName: string | null,
  scanId: string | null = null
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
    0,
    { operation: "remediation-plan", scanId }
  ) as Promise<RemediationResult>;
}

export async function researchIndustryBenchmark(
  industry: string | null,
  city: string | null,
  url: string,
  businessName: string | null,
  businessModel: "B2B" | "B2C" | "mixed" = "B2C",
  inferredVertical: string = "general",
  inferredVerticalParent: string = "Other",
  scanId: string | null = null
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

BUSINESS CLASSIFICATION (from visual analysis):
- Business Model: ${businessModel}
- Specific Vertical: ${inferredVertical}
- Parent Category: ${inferredVerticalParent}

CRITICAL RESEARCH RULES:
1. If businessModel is "B2B", you MUST search for commercial/wholesale/enterprise pricing. DO NOT use residential consumer pricing sources. Specifically REJECT these sources for B2B businesses: HomeAdvisor, Angi, Thumbtack, Fixr, HomeGuide, Houzz, CostHelper, and any site that provides "homeowner" or "residential" cost estimates.
2. If businessModel is "B2B", the average deal value should reflect business-to-business transaction sizes, not consumer purchases. A commercial soil brokerage moves thousands of tons — a $400 deal value is implausible. A commercial electrical contractor handles $5,000-$50,000 projects, not $150 service calls.
3. If businessModel is "B2C", consumer pricing sources are appropriate.
4. If businessModel is "mixed", weight toward the higher-value segment (typically the commercial side).
5. After determining the deal value, perform a sanity check: does this number make sense for a ${inferredVertical} operating as ${businessModel}? If not, re-research with more specific queries.

Search for "${industryLabel} average job ticket value" or "${industryLabel} average transaction value" and "${industryLabel} website traffic benchmarks". Find real numbers.`;

  let benchmarkAttempt = 0;
  try {
    const response = await callWithRetry(
      "researchIndustryBenchmark",
      async () => {
        benchmarkAttempt += 1;
        const start = Date.now();
        const controller = new AbortController();
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 90_000);
        try {
          const apiResp = (await client.messages.create(
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
          )) as unknown as {
            content: Array<{ type: string; text?: string; [k: string]: unknown }>;
            usage?: {
              input_tokens?: number;
              output_tokens?: number;
              cache_creation_input_tokens?: number;
              cache_read_input_tokens?: number;
            };
          };
          await recordAnthropicUsage({
            scanId,
            operation: "benchmark-research",
            model: MODEL,
            durationMs: Date.now() - start,
            status: "ok",
            attempt: benchmarkAttempt,
            usage: apiResp.usage ?? null,
          });
          return apiResp;
        } catch (err) {
          const normalized =
            timedOut && err instanceof APIUserAbortError
              ? new ClaudeCallTimeoutError("benchmark-research", 90_000)
              : err;
          const status: ApiCallStatus = isTransientAnthropicError(normalized)
            ? "retry"
            : "fail";
          await recordAnthropicUsage({
            scanId,
            operation: "benchmark-research",
            model: MODEL,
            durationMs: Date.now() - start,
            status,
            attempt: benchmarkAttempt,
            usage: null,
          });
          throw normalized;
        } finally {
          clearTimeout(timeout);
        }
      }
    );

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

    const result: IndustryBenchmark = {
      avgDealValue: Math.round(parsed.avgDealValue),
      dealValueLow: Math.round(parsed.dealValueLow),
      dealValueHigh: Math.round(parsed.dealValueHigh),
      avgMonthlyVisitors: Math.round(parsed.avgMonthlyVisitors),
      visitorsLow: Math.round(parsed.visitorsLow ?? parsed.avgMonthlyVisitors * 0.7),
      visitorsHigh: Math.round(parsed.visitorsHigh ?? parsed.avgMonthlyVisitors * 1.3),
      source: typeof parsed.source === "string" ? parsed.source : "web research",
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
    };

    // Sanity check: B2B deal values below $500 are suspicious
    if (businessModel === "B2B" && result.avgDealValue < 500) {
      console.warn(
        `[Benchmark] Suspiciously low B2B deal value: $${result.avgDealValue} for ${inferredVertical}. ` +
          `Source: ${result.source || "unknown"}. Clamping to minimum $500.`
      );
      result.avgDealValue = Math.max(result.avgDealValue, 500);
    }

    // Sanity check: B2C deal values below $25 are below the price of a coffee.
    if (businessModel === "B2C" && result.avgDealValue < 25) {
      console.warn(
        `[Benchmark] Suspiciously low B2C deal value: $${result.avgDealValue} for ${inferredVertical}. Clamping to minimum $25.`
      );
      result.avgDealValue = Math.max(result.avgDealValue, 25);
    }

    // Sanity check: Any deal value below $10 is almost certainly wrong
    if (result.avgDealValue < 10) {
      console.warn(
        `[Benchmark] Deal value below $10: $${result.avgDealValue} for ${inferredVertical}. Clamping to $50.`
      );
      result.avgDealValue = Math.max(result.avgDealValue, 50);
    }

    // Sanity check: visitors below 50/month suggest the model bailed
    // (a real active site that someone bothered to scan has more than this).
    if (result.avgMonthlyVisitors < 50) {
      console.warn(
        `[Benchmark] Suspiciously low monthly visitors: ${result.avgMonthlyVisitors} for ${inferredVertical}. Clamping to minimum 50.`
      );
      result.avgMonthlyVisitors = 50;
      result.visitorsLow = Math.max(result.visitorsLow, 35);
      result.visitorsHigh = Math.max(result.visitorsHigh, 70);
    }

    return result;
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
  benchmark?: IndustryBenchmark | null,
  scanId: string | null = null
): Promise<RevenueImpactResult> {
  const lighthouseDetails = extractLighthouseAuditDetails(lighthouseData);

  const benchmarkBlock = benchmark
    ? [
        ``,
        `BENCHMARK DATA (from automated research, may contain errors):`,
        `- Average Deal Value: $${benchmark.avgDealValue}`,
        `- Benchmark Confidence: ${benchmark.confidence ?? "unknown"}`,
        `- Benchmark Source: ${benchmark.source || "not specified"}`,
        `- Business Model: ${auditResult.businessModel ?? "B2C"}`,
        `- Inferred Vertical: ${auditResult.inferredVertical ?? "general"}`,
        ``,
        `INSTRUCTIONS FOR USING BENCHMARK DATA:`,
        `1. Use the provided deal value as your starting point, but apply critical judgment.`,
        `2. If the benchmark confidence is "low" or "unknown", treat the deal value as a rough estimate and note this uncertainty in your output.`,
        `3. Sanity-check the deal value against the business type. If it seems implausible for the stated vertical and business model, adjust toward a more reasonable estimate and explain your reasoning.`,
        `4. If you adjust the deal value, state both the original benchmark value and your adjusted value with reasoning.`,
        `5. Never present the revenue estimate as precise; it is an informed approximation.`,
      ].join("\n")
    : "";

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
    benchmarkBlock,
    ``,
    `Respond with ONLY a valid JSON object matching the schema above. No backticks, no markdown, no explanation.`,
  ].join("\n");

  const claude = await callClaudeWithJsonSchema(
    "revenue-impact",
    renderPrompt(REVENUE_SYSTEM_PROMPT, industry, city, url, businessName),
    user,
    revenueImpactSchema,
    1500,
    0,
    { operation: "revenue-impact", scanId }
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
