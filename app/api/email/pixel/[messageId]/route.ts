import { NextResponse } from "next/server";
import { recordEmailOpen } from "@/lib/canopy/email/messages";

/* Phase 4: 1x1 transparent gif open-tracking pixel.
 *
 * Always returns the gif (even on lookup failure) so a tracking
 * miss never produces a broken-image icon in the recipient's mail
 * client. The tracking write is best-effort; failures log but don't
 * block the response. Cache-Control: no-store ensures Gmail's image
 * proxy fetches every open instead of replaying a single fetch. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GIF_BYTES = Buffer.from(
  "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

function gifResponse(): NextResponse {
  return new NextResponse(new Uint8Array(GIF_BYTES), {
    status: 200,
    headers: {
      "content-type": "image/gif",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
      "content-length": String(GIF_BYTES.byteLength),
    },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await ctx.params;
  const id = Number(messageId);
  if (!Number.isInteger(id) || id <= 0) {
    return gifResponse();
  }
  try {
    await recordEmailOpen(id);
  } catch (err) {
    console.warn(
      "[email/pixel] open record failed:",
      err instanceof Error ? err.message : err
    );
  }
  return gifResponse();
}
