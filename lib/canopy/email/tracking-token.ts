import { createHmac, timingSafeEqual } from "node:crypto";

/* HMAC-based opaque token attached to outbound email tracking URLs.
 *
 * The pixel and click endpoints take a sequential email_messages.id
 * in the URL path. Without an authenticator, an attacker who knows the
 * id range can hit /api/email/pixel/{1..N} and /api/email/click/{1..N}
 * to inflate "open" / "click" counts on every tracked message. The
 * token below is appended as ?t=<16 hex> by wrapWithTracking() at
 * send time and validated server-side before any DB write; mismatched
 * or missing tokens silently skip the record (the pixel still serves
 * the gif and the click still redirects so the recipient experience
 * stays clean).
 *
 * The tag namespace ("email-tracking:") is fixed so a token computed
 * for one purpose cannot be replayed against a different endpoint
 * sharing the same secret. The 16-char prefix gives 2^64 search space,
 * comfortably more than the analytics threat model needs while keeping
 * the URL short. */

const TOKEN_NAMESPACE = "email-tracking:";
const TOKEN_LENGTH = 16;

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

export function computeEmailTrackingToken(messageId: number): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const h = createHmac("sha256", secret);
  h.update(TOKEN_NAMESPACE);
  h.update(String(messageId));
  return h.digest("hex").slice(0, TOKEN_LENGTH);
}

export function verifyEmailTrackingToken(
  messageId: number,
  token: string | null | undefined
): boolean {
  if (!token || token.length !== TOKEN_LENGTH) return false;
  const expected = computeEmailTrackingToken(messageId);
  if (!expected) return false;
  /* Both sides are hex strings of equal length, so the Buffer pair is
   * always equal-length and timingSafeEqual will not throw. */
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
