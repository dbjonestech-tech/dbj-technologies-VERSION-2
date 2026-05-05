import { getLiveVisitors } from "@/lib/services/analytics";

/* Live presence SSE for /admin/visitors.
 *
 * Pushes the "who is online in the last 5 minutes" snapshot every
 * 10 seconds. Auth is enforced by proxy.ts (admin session
 * required). Connection capped at MAX_CONNECTION_MS so the function
 * does not run indefinitely; EventSource on the client auto-reconnects.
 */

const POLL_INTERVAL_MS = 10_000;
const MAX_CONNECTION_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const start = Date.now();
      controller.enqueue(encoder.encode(": ok\n\n"));

      const aborted = () => request.signal.aborted;

      const sendSnapshot = async () => {
        try {
          const rows = await getLiveVisitors();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(rows)}\n\n`)
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "presence query failed";
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
          );
        }
      };

      await sendSnapshot();

      while (Date.now() - start < MAX_CONNECTION_MS && !aborted()) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (aborted()) break;
        await sendSnapshot();
        controller.enqueue(encoder.encode(": ping\n\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
