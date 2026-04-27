import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Webhook, WebhookVerificationError } from "svix";
import { handleResendWebhookEvent } from "@/lib/services/email";

/* runtime/dynamic exports omitted: the default Node.js runtime is
   required so the svix package (which uses node:crypto) loads, and
   the request handler has no need for cacheComponents semantics. */

/**
 * Resend bounce / complaint / delivered webhook receiver.
 *
 * Configure the destination URL in the Resend dashboard as:
 *   https://dbjtechnologies.com/api/webhooks/resend
 * and set RESEND_WEBHOOK_SECRET in Vercel to the secret shown there.
 *
 * Security: every request is verified with svix using the secret.
 * Unsigned or wrong-signature requests get a 401. Only POST is
 * accepted; other verbs get 405.
 *
 * Reliability: we ingest events idempotently (see migration 006's
 * partial unique index on (resend_id, status)) and respond 200 even
 * on internal handler failures (after capturing to Sentry) so that a
 * transient DB outage does not trigger a Resend retry storm. The one
 * non-200 path is signature failure, where the 401 is the right
 * signal back to Resend that the request was rejected for a real
 * reason and should not be retried.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook/resend] RESEND_WEBHOOK_SECRET is not configured"
    );
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 }
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing required webhook signature headers." },
      { status: 400 }
    );
  }

  // svix verifies over the exact bytes that arrived; reading text()
  // before any JSON parse is what gives us a stable canonical payload.
  const rawBody = await request.text();

  let event: unknown;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn(
        "[webhook/resend] signature verification failed",
        err.message
      );
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }
    Sentry.captureException(err, {
      tags: { source: "resend-webhook", phase: "verify" },
    });
    return NextResponse.json(
      { error: "Could not verify webhook signature." },
      { status: 401 }
    );
  }

  try {
    const outcome = await handleResendWebhookEvent(event);
    return NextResponse.json({ ok: true, outcome }, { status: 200 });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { source: "resend-webhook", phase: "handle" },
    });
    console.error("[webhook/resend] handler failure", err);
    // Return 200 so Resend does not retry. We've already captured the
    // error to Sentry; retries would only multiply the same failure.
    return NextResponse.json({ ok: true, outcome: "error" }, { status: 200 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    { error: "Method Not Allowed. Webhook accepts POST only." },
    { status: 405, headers: { allow: "POST" } }
  );
}
