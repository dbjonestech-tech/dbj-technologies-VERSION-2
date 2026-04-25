import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

/* ─── HTML SANITIZATION ─────────────────────────── */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ─── IN-MEMORY RATE LIMITER ────────────────────── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per window
const CLEANUP_THRESHOLD = 1000; // Clean up when map gets large

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Inline cleanup when map grows too large (replaces setInterval)
  if (rateLimitMap.size > CLEANUP_THRESHOLD) {
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

/* ─── SERVER-SIDE VALIDATION (defense in depth) ──── */
const contactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional().default(""),
  company: z.string().max(200).optional().default(""),
  budget: z.string().min(1).max(100),
  projectType: z.string().min(1).max(100),
  message: z.string().min(10).max(5000),
  // Honeypot field — should always be empty
  website: z.string().max(0, "Bot detected").optional().default(""),
});

export async function POST(request: Request) {
  try {
    /* ─── ORIGIN VALIDATION ───────────────────── */
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "https://dbjtechnologies.com",
      "https://www.dbjtechnologies.com",
    ];
    // Allow localhost in development
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
    }
    if (!origin || !allowedOrigins.includes(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ─── CONTENT-TYPE CHECK ──────────────────── */
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
    }

    /* ─── RATE LIMITING ───────────────────────── */
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    /* ─── REQUEST SIZE CHECK ──────────────────── */
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = await request.json();

    /* ─── HONEYPOT CHECK ──────────────────────── */
    if (body.website && body.website.length > 0) {
      // Silently accept to not alert bots, but don't process
      return NextResponse.json({ success: true });
    }

    // Server-side validation
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, company, budget, projectType, message } = result.data;

    // Sanitize ALL user input before HTML interpolation
    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      phone: escapeHtml(phone || "Not provided"),
      company: escapeHtml(company || "Not provided"),
      budget: escapeHtml(budget),
      projectType: escapeHtml(projectType),
      message: escapeHtml(message),
    };

    const htmlBody = `
      <h2>New Project Inquiry from ${safe.name}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.name}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.phone}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.company}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Budget</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.budget}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Project Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${safe.projectType}</td></tr>
      </table>
      <h3 style="margin-top:20px;">Message</h3>
      <p style="white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:8px;">${safe.message}</p>
    `;

    if (!process.env.RESEND_API_KEY) {
      if (process.env.NODE_ENV === "development") {
        // Local development convenience: surface that a submission arrived
        // when the dev hasn't configured Resend yet. Never reached in
        // production because the early return below short-circuits.
        console.log(
          "[contact] RESEND_API_KEY not set; submission accepted but no email sent (dev only)"
        );
        return NextResponse.json({ success: true });
      }
      // Production: missing email config is a server error, not a silent
      // success. Surface it so the user retries instead of believing
      // their inquiry was delivered.
      console.error("[contact] RESEND_API_KEY missing in production");
      return NextResponse.json(
        { error: "Server configuration error. Please email joshua@dbjtechnologies.com directly." },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "DBJ Technologies Website <joshua@dbjtechnologies.com>",
      to: process.env.CONTACT_EMAIL || "joshua@dbjtechnologies.com",
      replyTo: email,
      subject: `New Project Inquiry: ${safe.projectType} - ${safe.name}`,
      html: htmlBody,
    });
    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
