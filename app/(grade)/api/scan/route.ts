import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { emailLimiter, ipLimiter, scanDomainLimiter } from "@/lib/rate-limit";
import { track } from "@/lib/services/monitoring";
import { attachScanToSession } from "@/lib/services/analytics";
import { readSessionIdFromRequest } from "@/lib/services/visitor-id";
import { hostnameResolvesPublic, normalizeUrl } from "@/lib/services/url";

const scanSchema = z.object({
  url: z.string().url(),
  email: z.string().email(),
  businessName: z.string().optional(),
  city: z.string().optional().default("Dallas"),
  turnstileToken: z.string().min(1),
});

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip && ip !== "unknown") form.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }
  );
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

function extractIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { url: rawUrl, email, businessName, city, turnstileToken } = parsed.data;
    const ip = extractIp(request);

    /* Boundary URL validation: normalize to a canonical form (rejects
     * non-http/https schemes, embedded credentials, and sensitive query
     * params) and reject hosts that resolve to a private network. The
     * Inngest pipeline does the same checks plus a HEAD probe later;
     * the boundary versions give the user immediate 400 feedback and
     * keep garbage strings out of the scans table. The HEAD probe is
     * deliberately skipped here so the API stays sub-second. */
    let url: string;
    try {
      url = normalizeUrl(rawUrl);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid URL." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }
    if (!(await hostnameResolvesPublic(parsedUrl.hostname))) {
      return NextResponse.json(
        { error: "URL must be a publicly reachable site." },
        { status: 400 }
      );
    }

    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json(
        { error: "Bot verification failed" },
        { status: 403 }
      );
    }

    const emailCheck = await emailLimiter(email);
    if (!emailCheck.success) {
      await track(
        "scan.rate-limited",
        { reason: "email" },
        { level: "warn" }
      );
      return NextResponse.json(
        { error: "Too many scans for this email. Try again tomorrow." },
        { status: 429 }
      );
    }

    const ipCheck = await ipLimiter(ip);
    if (!ipCheck.success) {
      await track(
        "scan.rate-limited",
        { reason: "ip" },
        { level: "warn" }
      );
      return NextResponse.json(
        { error: "Too many scans from this location. Try again tomorrow." },
        { status: 429 }
      );
    }

    /* Per-domain cap: catches the IP+email rotation pattern where a
     * viral mention or a curiosity loop scans the same site over and
     * over. Each duplicate scan costs real money (Browserless +
     * Anthropic + PSI) for output largely redundant with the existing
     * scan. The /admin one-shot scan path bypasses this; admins
     * legitimately rescan during demos. */
    const domainCheck = await scanDomainLimiter(parsedUrl.hostname);
    if (!domainCheck.success) {
      await track(
        "scan.rate-limited",
        { reason: "domain", hostname: parsedUrl.hostname },
        { level: "warn" }
      );
      return NextResponse.json(
        {
          error:
            "This site has already been scanned several times in the last 24 hours. Try again tomorrow.",
        },
        { status: 429 }
      );
    }

    const sql = getDb();

    // De-dupe: if the same (email, url) already has a scan started in the
    // last 24 hours, return that scanId instead of triggering a new pipeline
    // run. Stops accidental duplicate submissions and bot replays from
    // burning PSI quota, Browserless minutes, and Anthropic spend.
    const dedupeRows = (await sql`
      SELECT id FROM scans
      WHERE email = ${email}
        AND url = ${url}
        AND created_at > now() - interval '24 hours'
        AND status <> 'failed'
      ORDER BY created_at DESC
      LIMIT 1
    `) as { id: string }[];
    if (dedupeRows.length > 0) {
      await track(
        "scan.deduped",
        {},
        { scanId: dedupeRows[0]!.id }
      );
      return NextResponse.json(
        { scanId: dedupeRows[0]!.id, status: "deduped" },
        { status: 200 }
      );
    }

    const scanRows = (await sql`
      INSERT INTO scans (url, email, business_name, city, status)
      VALUES (${url}, ${email}, ${businessName ?? null}, ${city}, 'pending')
      RETURNING id
    `) as { id: string }[];
    const scanId = scanRows[0]!.id;

    await sql`
      INSERT INTO leads (email, business_name, url, city, scan_id)
      VALUES (${email}, ${businessName ?? null}, ${url}, ${city}, ${scanId})
      ON CONFLICT (email) DO UPDATE
      SET scan_count = leads.scan_count + 1,
          last_scan_at = now(),
          business_name = COALESCE(EXCLUDED.business_name, leads.business_name)
    `;

    await inngest.send({
      name: "pathlight/scan.requested",
      data: { scanId },
    });

    /* Attribute this scan to the visitor's analytics session if one
     * exists. Best-effort; missing or expired session is fine. */
    const sessionId = readSessionIdFromRequest(request);
    if (sessionId) {
      await attachScanToSession({ sessionId, scanId });
    }

    await track("scan.requested", { url, hasBusinessName: Boolean(businessName) }, { scanId });

    return NextResponse.json({ scanId, status: "pending" }, { status: 202 });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
