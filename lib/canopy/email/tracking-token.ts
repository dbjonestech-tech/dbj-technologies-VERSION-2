import { createHmac, timingSafeEqual } from "node:crypto";

/* HMAC-based opaque token attached to outbound email tracking URLs.
 *
 * The pixel and click endpoints take a sequential email_messages.id
 * in the URL path. Without an authenticator, an attacker who knows the
 * id range can hit /api/email/pixel/{1..N} and /api/email/click/{1..N}
 * to inflate "open" / "click" counts on every tracked message. The
 * token below is appended as ?t=<DAY.SIG> by wrapWithTracking() at
 * send time and validated server-side before any DB write; mismatched,
 * missing, or expired tokens silently skip the record (the pixel still
 * serves the gif and the click still redirects so the recipient
 * experience stays clean).
 *
 * Token format: <day-bucket-base36>.<16-hex-HMAC>. The day bucket is
 * floor(mintMs / 86_400_000) and is included in the HMAC input, so an
 * attacker cannot rewrite the day part without invalidating the
 * signature. Verify accepts tokens minted within MAX_AGE_DAYS of the
 * server's current day, with a single-day clock-skew tolerance. This
 * means an attacker who scrapes a sent email can replay opens / clicks
 * for at most 90 days, after which the token expires.
 *
 * The tag namespace ("email-tracking:") is fixed so a token computed
 * for one purpose cannot be replayed against a different endpoint
 * sharing the same secret. The 16-char HMAC prefix gives 2^64 search
 * space, comfortably more than the analytics threat model needs while
 * keeping the URL short. */

const TOKEN_NAMESPACE = "email-tracking:";
const HMAC_LENGTH = 16;
const MAX_AGE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    console.warn(
      "[email/tracking-token] AUTH_SECRET is not set; tracking tokens cannot be generated or validated"
    );
    return null;
  }
  return s;
}

function dayBucketFor(timestampMs: number): number {
  return Math.floor(timestampMs / MS_PER_DAY);
}

function signature(secret: string, messageId: number, dayBucket: number): string {
  const h = createHmac("sha256", secret);
  h.update(TOKEN_NAMESPACE);
  h.update(String(messageId));
  h.update(":");
  h.update(String(dayBucket));
  return h.digest("hex").slice(0, HMAC_LENGTH);
}

export function computeEmailTrackingToken(
  messageId: number,
  mintMs: number = Date.now()
): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const day = dayBucketFor(mintMs);
  const sig = signature(secret, messageId, day);
  return `${day.toString(36)}.${sig}`;
}

export function verifyEmailTrackingToken(
  messageId: number,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const dayPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  if (sigPart.length !== HMAC_LENGTH) return false;

  const day = parseInt(dayPart, 36);
  if (!Number.isFinite(day) || day < 0) return false;

  const today = dayBucketFor(Date.now());
  /* Allow up to MAX_AGE_DAYS in the past and 1 day in the future
   * (clock skew between sender and validator). */
  if (today - day > MAX_AGE_DAYS) return false;
  if (day - today > 1) return false;

  const secret = getSecret();
  if (!secret) return false;
  const expected = signature(secret, messageId, day);
  try {
    return timingSafeEqual(Buffer.from(sigPart), Buffer.from(expected));
  } catch {
    return false;
  }
}
