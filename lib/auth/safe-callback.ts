/* Validate a callback path before passing it to next/navigation
 * redirect(). Without this, /signin?callbackUrl=https://attacker.com/
 * sends an already-signed-in admin to attacker.com (open-redirect
 * primitive in phishing chains).
 *
 * Auth.js validates redirectTo on the signIn() path itself, so the
 * unauthenticated-user flow is already covered. The bypass branch
 * (user is already signed in, page calls redirect(callbackUrl) directly)
 * is what this guards.
 *
 * Accepts: a relative path that starts with a single "/" (so "/admin",
 * "/portal/files", "/admin?from=email"). Rejects: anything starting
 * with "//" (protocol-relative), "/\" (some browsers parse this as
 * protocol-relative), or any absolute URL. Rejects strings with
 * \r/\n to defang any header-injection downstream. Falls back to the
 * caller-supplied default on any rejection. */
export function safeCallbackPath(
  raw: string | undefined,
  fallback: string
): string {
  if (typeof raw !== "string") return fallback;
  if (raw.length === 0 || raw.length > 2048) return fallback;
  if (raw.includes("\r") || raw.includes("\n") || raw.includes("\0")) {
    return fallback;
  }
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
