import {
  getMaxPageViewId,
  getPageViewsAfterId,
  type RecentPageViewRow,
} from "@/lib/services/analytics";

/* SSE stream of new page_views for /admin/visitors.
 *
 * Mirrors the pattern at /admin/monitor/api/stream: poll for rows
 * with id > lastSeen every 2 seconds and push each new row as an
 * SSE data frame. Connection capped; client auto-reconnects.
 *
 * The wire format mirrors the DB column shape (snake_case) so the
 * client component can render rows without a schema translation step.
 */

const POLL_INTERVAL_MS = 2_000;
const MAX_CONNECTION_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toWireFormat(row: RecentPageViewRow) {
  return {
    id: row.id,
    path: row.path,
    referrer_host: row.referrerHost,
    country: row.country,
    city: row.city,
    device_type: row.deviceType,
    browser: row.browser,
    is_bot: row.isBot,
    created_at: row.createdAt,
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requestedAfter = url.searchParams.get("after");
  let lastId = requestedAfter && /^\d+$/.test(requestedAfter)
    ? requestedAfter
    : await getMaxPageViewId();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const start = Date.now();
      controller.enqueue(encoder.encode(": ok\n\n"));

      const aborted = () => request.signal.aborted;

      while (Date.now() - start < MAX_CONNECTION_MS && !aborted()) {
        try {
          const rows = await getPageViewsAfterId(lastId, 100, false);
          for (const row of rows) {
            const data = JSON.stringify(toWireFormat(row));
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            lastId = row.id;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "stream poll failed";
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode(": ping\n\n"));
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
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
