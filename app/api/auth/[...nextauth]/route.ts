import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { signinLimiter } from "@/lib/rate-limit";

/* Thin wrapper around the Auth.js v5 handlers. Only the OAuth
 * initiation + callback paths are rate-limited — session reads
 * (/api/auth/session, /api/auth/csrf, /api/auth/providers) get hit
 * on every protected page render and must not be throttled. */

function shouldRateLimit(req: NextRequest): boolean {
  const path = new URL(req.url).pathname;
  return path.includes("/signin/") || path.includes("/callback/");
}

function extractIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

async function gate(req: NextRequest): Promise<Response | null> {
  if (!shouldRateLimit(req)) return null;
  const ip = extractIp(req);
  const { success } = await signinLimiter(ip);
  if (success) return null;
  return new Response("Too many sign-in attempts. Wait a minute and try again.", {
    status: 429,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const blocked = await gate(req);
  if (blocked) return blocked;
  return handlers.POST(req);
}
