/* Stable per-device fingerprint used to detect sign-ins from a device
 * we have not seen before. Hashing IP + user-agent (rather than storing
 * either raw) keeps the audit log minimally identifying — we can answer
 * "is this device new?" without keeping a plaintext IP/UA history.
 *
 * Uses Web Crypto (globalThis.crypto.subtle) so this module is safe to
 * import from any runtime (Edge, Node, browser). The auth.config.ts
 * vs. auth.ts split keeps this out of middleware bundles, but using
 * Web Crypto means future imports from middleware won't break either. */
export async function deviceHash(
  ip: string | null,
  userAgent: string | null
): Promise<string> {
  const seed = `${ip ?? "unknown"}::${userAgent ?? "unknown"}`;
  const data = new TextEncoder().encode(seed);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
