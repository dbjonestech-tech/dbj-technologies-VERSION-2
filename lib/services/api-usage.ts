import { getDb } from "../db";

/**
 * Pricing table for outbound APIs, in USD per million tokens (Anthropic)
 * or USD per call (everything else with a deterministic per-call cost).
 *
 * Anthropic public pricing as of January 2026. Numbers will drift over
 * time and should be reconciled against the official pricing page
 * occasionally. Cost rows logged with stale rates remain historically
 * meaningful (they capture spend at the moment of the call) — the
 * dashboard reads cost_usd verbatim, it does not retroactively reprice.
 *
 * Cache write rate uses ephemeral 5-minute TTL pricing (1.25x base
 * input rate) since that is the only TTL the codebase currently sets.
 * If we add 1-hour cache writes (2x base input) we'll need to track
 * the cache TTL alongside the token count.
 */
type AnthropicRate = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
};

const ANTHROPIC_RATES_USD_PER_MTOK: Record<string, AnthropicRate> = {
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-haiku-4-5-20251001": {
    input: 0.8,
    output: 4.0,
    cacheRead: 0.08,
    cacheWrite: 1.0,
  },
};

export type ApiProvider = "anthropic" | "browserless" | "pagespeed" | "resend";
export type ApiCallStatus = "ok" | "retry" | "fail";

type AnthropicTokenUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export function calculateAnthropicCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number
): number {
  const rate = ANTHROPIC_RATES_USD_PER_MTOK[model];
  if (!rate) return 0;
  const cost =
    (inputTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output +
    (cacheReadTokens / 1_000_000) * rate.cacheRead +
    (cacheWriteTokens / 1_000_000) * rate.cacheWrite;
  return Number.isFinite(cost) ? cost : 0;
}

/**
 * Record one outbound API call. All record functions swallow their own
 * errors and return void — instrumentation must never break a real
 * pipeline call. Errors are console.warn'd; if they become a pattern
 * the daily cost cron will surface zero-spend days, which is the
 * tripwire.
 */
async function recordEvent(params: {
  scanId: string | null;
  provider: ApiProvider;
  operation: string;
  model?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  durationMs?: number | null;
  status: ApiCallStatus;
  attempt?: number;
  costUsd?: number;
}): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO api_usage_events (
        scan_id, provider, operation, model,
        input_tokens, output_tokens,
        cache_read_tokens, cache_write_tokens,
        duration_ms, status, attempt, cost_usd
      ) VALUES (
        ${params.scanId},
        ${params.provider},
        ${params.operation},
        ${params.model ?? null},
        ${params.inputTokens ?? 0},
        ${params.outputTokens ?? 0},
        ${params.cacheReadTokens ?? 0},
        ${params.cacheWriteTokens ?? 0},
        ${params.durationMs ?? null},
        ${params.status},
        ${params.attempt ?? 1},
        ${params.costUsd ?? 0}
      )
    `;
  } catch (err) {
    console.warn(
      `[api-usage] failed to record ${params.provider}/${params.operation}`,
      err instanceof Error ? err.message : err
    );
  }
}

export type AnthropicUsageRecord = {
  scanId: string | null;
  operation: string;
  model: string;
  durationMs: number;
  status: ApiCallStatus;
  attempt: number;
  usage?: AnthropicTokenUsage | null;
};

/**
 * Anthropic-specific recorder. Pulls the four token counts from the
 * API response's usage block (or zeros if the call failed before a
 * response came back) and computes cost_usd at log time using the
 * pricing table above.
 */
export async function recordAnthropicUsage(
  record: AnthropicUsageRecord
): Promise<void> {
  const usage = record.usage ?? null;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const cacheReadTokens = usage?.cache_read_input_tokens ?? 0;
  const cacheWriteTokens = usage?.cache_creation_input_tokens ?? 0;
  const costUsd = calculateAnthropicCostUsd(
    record.model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  );
  await recordEvent({
    scanId: record.scanId,
    provider: "anthropic",
    operation: record.operation,
    model: record.model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    durationMs: record.durationMs,
    status: record.status,
    attempt: record.attempt,
    costUsd,
  });
}

export type BrowserlessUsageRecord = {
  scanId: string | null;
  operation: string;
  durationMs: number;
  status: ApiCallStatus;
  attempt?: number;
};

/**
 * Browserless usage. We don't track per-call dollar cost (Browserless
 * v2 bills on a unit-bucket plan, not per-screenshot) but we record
 * call count and duration so the dashboard can spot a runaway loop or
 * a screenshot path that suddenly takes 30 seconds instead of 3.
 */
export async function recordBrowserlessUsage(
  record: BrowserlessUsageRecord
): Promise<void> {
  await recordEvent({
    scanId: record.scanId,
    provider: "browserless",
    operation: record.operation,
    durationMs: record.durationMs,
    status: record.status,
    attempt: record.attempt ?? 1,
  });
}

export type PagespeedUsageRecord = {
  scanId: string | null;
  operation: string;
  durationMs: number;
  status: ApiCallStatus;
  attempt?: number;
};

/**
 * PageSpeed Insights usage. Free up to 25k queries/day with an API
 * key; tracking call count is mostly to spot quota concerns and to
 * see PSI's contribution to total scan time.
 */
export async function recordPagespeedUsage(
  record: PagespeedUsageRecord
): Promise<void> {
  await recordEvent({
    scanId: record.scanId,
    provider: "pagespeed",
    operation: record.operation,
    durationMs: record.durationMs,
    status: record.status,
    attempt: record.attempt ?? 1,
  });
}
