import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFullScanReport } from "@/lib/db/queries";
import { buildChatSystemPrompt } from "@/lib/prompts/pathlight-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let stream: ReturnType<typeof client.messages.stream>;
  try {
    stream = client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    });
  } catch (err) {
    console.error("[chat] failed to start stream", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }

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
        const message = err instanceof Error ? err.message : "stream error";
        safeEnqueue(`data: ${JSON.stringify({ error: message })}\n\n`);
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
