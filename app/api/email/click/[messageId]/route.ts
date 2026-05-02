import { NextResponse } from "next/server";
import { recordEmailClick } from "@/lib/canopy/email/messages";

/* Phase 4: click-tracking redirector.
 *
 * Receives the original target URL via ?to=<encodedUrl>, records the
 * click against the message id, then 302-redirects. Validates that
 * the destination is http(s) so the endpoint can't be repurposed as
 * an open redirector to javascript:/data: schemes. On any failure we
 * still redirect to the destination (or to the home page if no valid
 * destination) so a tracking error never strands the recipient. */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeDestination(raw: string | null): string {
  if (!raw) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    const url = new URL(decoded);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "/";
    return url.toString();
  } catch {
    return "/";
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await ctx.params;
  const incoming = new URL(req.url);
  const dest = safeDestination(incoming.searchParams.get("to"));

  const id = Number(messageId);
  if (Number.isInteger(id) && id > 0) {
    try {
      await recordEmailClick(id, dest);
    } catch (err) {
      console.warn(
        "[email/click] click record failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return NextResponse.redirect(dest, { status: 302 });
}
