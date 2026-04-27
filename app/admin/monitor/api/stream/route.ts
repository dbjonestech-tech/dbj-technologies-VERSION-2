import {
  getEventsAfterId,
  getMaxEventId,
} from "@/lib/services/monitoring";

/* SSE live tail for /admin/monitor.
 *
 * Polls monitoring_events every 2s for rows with id > lastSeen and
 * pushes each new row as a `data:` SSE frame. Connection is capped at
 * MAX_CONNECTION_MS so the function does not run indefinitely; the
 * client reconnects automatically.
 *
 * Auth: gated by middleware.ts (admin session required). The route
 * itself adds no further check.
 */

const POLL_INTERVAL_MS = 2_000;
const MAX_CONNECTION_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Optional ?after= cursor lets the client resume after a reconnect.
  // Without it we start from the current MAX(id) so the client only
  // receives rows newer than the seed snapshot rendered server-side.
  const requestedAfter = url.searchParams.get("after");
  let lastId = requestedAfter && /^\d+$/.test(requestedAfter)
    ? requestedAfter
    : await getMaxEventId();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const start = Date.now();
      // Initial keepalive comment so the client transitions from
      // CONNECTING to OPEN immediately.
      controller.enqueue(encoder.encode(": ok\n\n"));

      const aborted = () => request.signal.aborted;

      while (Date.now() - start < MAX_CONNECTION_MS && !aborted()) {
        try {
          const rows = await getEventsAfterId(lastId, 100);
          for (const row of rows) {
            const data = JSON.stringify(row);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            lastId = row.id;
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "stream poll failed";
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
          );
        }
        // Heartbeat keeps proxies from idling the connection.
        controller.enqueue(encoder.encode(": ping\n\n"));
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
