import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFullScanReport } from "@/lib/db/queries";
import { buildChatSystemPrompt } from "@/lib/prompts/pathlight-chat";
import { recordAnthropicUsage } from "@/lib/services/api-usage";
import { chatLimiter, chatScanLimiter, extractIp } from "@/lib/rate-limit";

/* runtime/dynamic exports removed; redundant with the default Node.js
   runtime for route handlers in Next 16 and incompatible with the
   experimental.cacheComponents option enabled in next.config.mjs. */

const CHAT_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 20;

const chatSchema = z.object({
  scanId: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(MAX_MESSAGES),
});

function jsonError(message: string, status: number): Response {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const ipCheck = await chatLimiter(extractIp(request));
  if (!ipCheck.success) {
    return jsonError("Too many chat requests. Try again tomorrow.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "Invalid request. Provide a scan ID and at least one message.",
      400
    );
  }
  const { scanId, messages } = parsed.data;

  /* Per-scan ceiling complements the per-IP one above. Caps total
     Haiku spend on any single scanId even when many IPs hit it. */
  const scanCheck = await chatScanLimiter(scanId);
  if (!scanCheck.success) {
    return jsonError(
      "This conversation has reached its daily limit. Try again tomorrow.",
      429
    );
  }

  const report = await getFullScanReport(scanId);
  if (!report) {
    return jsonError("Scan not found.", 404);
  }
  if (report.status !== "complete" && report.status !== "partial") {
    return jsonError(
      "This scan is not ready yet. Please wait for it to finish.",
      404
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError("Chat is temporarily unavailable.", 500);
  }

  const system = buildChatSystemPrompt(report);
  const client = new Anthropic({ apiKey });

  // Wrap the per-conversation system prompt in a cacheable block so each
  // turn after the first within a 5-minute window hits Anthropic's prompt
  // cache instead of re-billing the full system prompt input. Caching is
  // only effective when the prompt is identical across calls; the chat
  // system prompt is constant for a given scanId, so every turn in one
  // conversation shares the same cache key.
  const cacheableSystem = [
    {
      type: "text" as const,
      text: system,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const callStart = Date.now();
  let stream: ReturnType<typeof client.messages.stream>;
  try {
    stream = client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      system: cacheableSystem,
      messages,
    });
  } catch (err) {
    console.error("[chat] failed to start stream", err);
    await recordAnthropicUsage({
      scanId,
      operation: "chat",
      model: CHAT_MODEL,
      durationMs: Date.now() - callStart,
      status: "fail",
      attempt: 1,
      usage: null,
    });
    return jsonError("Something went wrong. Please try again.", 500);
  }

  // Schedule a single usage-record write to fire after the stream
  // settles. finalMessage() resolves with the assembled Message
  // (including usage tokens) once the stream finishes successfully;
  // it rejects if the stream errors. Either branch logs once.
  void stream
    .finalMessage()
    .then((msg: unknown) => {
      const usage = (msg as { usage?: unknown }).usage as
        | {
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
          }
        | undefined;
      void recordAnthropicUsage({
        scanId,
        operation: "chat",
        model: CHAT_MODEL,
        durationMs: Date.now() - callStart,
        status: "ok",
        attempt: 1,
        usage: usage ?? null,
      });
    })
    .catch(() => {
      void recordAnthropicUsage({
        scanId,
        operation: "chat",
        model: CHAT_MODEL,
        durationMs: Date.now() - callStart,
        status: "fail",
        attempt: 1,
        usage: null,
      });
    });

  const encoder = new TextEncoder();
  const sse = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const safeEnqueue = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          /* client disconnected */
        }
      };

      stream.on("text", (delta: string) => {
        if (!delta) return;
        safeEnqueue(`data: ${JSON.stringify({ text: delta })}\n\n`);
      });

      stream.on("error", (err: unknown) => {
        if (closed) return;
        console.error("[chat] stream error", err);
        safeEnqueue(
          `data: ${JSON.stringify({ error: "Something went wrong. Please try again." })}\n\n`
        );
        safeEnqueue("data: [DONE]\n\n");
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });

      stream.on("end", () => {
        if (closed) return;
        safeEnqueue("data: [DONE]\n\n");
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      try {
        stream.abort();
      } catch {
        /* noop */
      }
    },
  });

  return new Response(sse, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
