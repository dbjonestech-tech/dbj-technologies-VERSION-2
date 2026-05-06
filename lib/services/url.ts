import { promises as dns } from "node:dns";
import net from "node:net";
import { Agent } from "undici";

export type UrlValidationResult = {
  valid: boolean;
  error?: string;
  resolvedUrl?: string;
  /* Structured diagnostic surfaced on every result (success and
   * failure). Logged into the scan.failed monitoring event payload so
   * we can later identify host-class patterns: e.g. "67% of failed
   * scans against GoDaddy-nameservered hosts share the connection-
   * blocked failureKind, suggesting their WAF is the systemic
   * bottleneck rather than the prospect's site being genuinely
   * down." Optional everywhere; absent on synchronous validation
   * failures (malformed URL, unsupported protocol). */
  diagnostic?: UrlValidationDiagnostic;
};

/* Specific, actionable categories. Anything other than "ok" is a
 * failure mode the operator can investigate or filter on. */
export type ValidationFailureKind =
  | "ok"
  | "malformed"
  | "protocol"
  | "ssrf-blocked"
  | "dns-fail"
  | "connection-blocked"
  | "timeout"
  | "http-error"
  | "redirect-loop"
  | "redirect-blocked"
  | "unknown";

export type UrlValidationDiagnostic = {
  /* Stable enum the monitor can group on. "connection-blocked" is the
   * WAF signature (TCP-RST or instant connection refusal, no HTTP
   * response) and is the most actionable because it almost always
   * means the upstream's host is filtering Vercel's egress IP rather
   * than the site being genuinely offline. */
  failureKind: ValidationFailureKind;
  /* HTTP status from the upstream when one was actually returned.
   * Null on connection-blocked / dns-fail / timeout paths (where no
   * HTTP exchange completed) and on the success path when we want
   * to keep the field shape consistent. */
  httpStatus: number | null;
  /* Server header from any response we did get. "Apache" /
   * "GoDaddy/Apache" / "cloudflare" / "Microsoft-IIS/10.0" / etc.
   * Useful for clustering failures by hosting platform. */
  serverHeader: string | null;
  /* Authoritative nameservers for the hostname. Captured on failure
   * so we can spot patterns ("85% of WAF-blocked failures use
   * NS*.GODADDY.COM"). Lazily resolved; null on success or when the
   * NS lookup itself fails. */
  nameservers: string[] | null;
  /* How many fetch calls we made for this validation (1 normally,
   * 2 if the connection-retry fired). */
  attempts: number;
  /* True when the Vercel-egress probe failed connection-level and
   * we recovered via the Browserless fallback. The downstream
   * pipeline still uses Vercel for its own fetches, but the
   * actual screenshot path uses Browserless anyway, so a
   * Vercel-blocked / Browserless-reachable site is a real scan
   * candidate, not an unreachable one. */
  recoveredViaBrowserless: boolean;
  /* True when the failure-timing matches the WAF anti-DDoS
   * signature (sub-100ms connection-blocked). Treat as a red flag
   * specifically: it almost never means the site is offline. */
  fastConnectionBlocked: boolean;
  /* Total time spent in validation, ms. Mirrors the existing
   * pipeline-throw durationMs but at the validation-step
   * granularity so admin/monitor can chart validation latency
   * trends independently. */
  durationMs: number;
};

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/* User-Agent for the validation reachability probe. We previously
 * shipped "PathlightBot/1.0" here; many shared-hosting WAFs (GoDaddy,
 * GreenGeeks, others) score scanner-style UAs higher on their abuse
 * heuristics and tear down the TCP connection before our HEAD request
 * lands, manifesting as a sub-10ms "URL is not reachable" pipeline
 * throw with no record of an upstream HTTP status. The browserless
 * captures and the OG image proxy both already use a realistic Chrome
 * UA for the same reason; matching it here keeps validation,
 * Lighthouse, screenshots, and OG proxy behind one consistent client
 * fingerprint, which also avoids a Cloudflare Bot Score divergence
 * across the four request paths against the same site. */
const VALIDATE_URL_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const SENSITIVE_QUERY_PARAM_NAMES = new Set([
  "token",
  "access_token",
  "auth",
  "auth_token",
  "api_key",
  "apikey",
  "jwt",
  "session",
  "session_id",
  "sessionid",
  "key",
  "secret",
  "password",
  "passwd",
  "pwd",
  "code",
  "id_token",
  "refresh_token",
  "bearer",
  "signature",
  "sig",
]);

export function normalizeUrl(raw: string): string {
  let input = (raw ?? "").trim();
  if (!input) {
    throw new Error("URL is empty.");
  }

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input)) {
    input = `https://${input}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("URL is malformed.");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("URL uses an unsupported protocol.");
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      "URL contains embedded credentials. Remove the username and password before scanning."
    );
  }

  for (const key of parsed.searchParams.keys()) {
    if (SENSITIVE_QUERY_PARAM_NAMES.has(key.toLowerCase())) {
      throw new Error(
        "URL contains an authentication or session token. Paste the public homepage URL instead."
      );
    }
  }

  parsed.search = "";
  parsed.hash = "";
  const path = parsed.pathname.replace(/\/+$/g, "");
  parsed.pathname = path === "" ? "/" : path;

  return parsed.toString().replace(/\/$/, "");
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice("::ffff:".length);
      return isPrivateIp(v4);
    }
    return false;
  }
  return true;
}

export async function hostnameResolvesPublic(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "localhost.localdomain") return false;
  if (net.isIP(hostname)) return !isPrivateIp(hostname);
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.length === 0) return false;
    return records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

/* DNS-rebinding defense. Resolve the hostname ONCE, return the IP we
 * intend to connect to. The downstream fetch then uses this exact IP
 * via a pinned undici Agent so a second DNS lookup at connect time
 * cannot return a different (potentially private) address.
 *
 * Returns null if the hostname is localhost, an IP literal that is
 * private, or resolves to anything private. The lookup is rejected if
 * ANY returned record is private (matches the
 * `records.every((r) => !isPrivateIp(r.address))` posture used by
 * hostnameResolvesPublic so we never connect to a host that round-
 * robins between public and private IPs). */
async function resolveToPublicIp(hostname: string): Promise<string | null> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "localhost.localdomain") return null;
  if (net.isIP(hostname)) {
    return isPrivateIp(hostname) ? null : hostname;
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.length === 0) return null;
    if (records.some((r) => isPrivateIp(r.address))) return null;
    return records[0]!.address;
  } catch {
    return null;
  }
}

/* Build an undici Agent whose connect step always uses the supplied
 * IP regardless of what the URL hostname resolves to at connect time.
 * The Host header and TLS SNI continue to use the URL hostname so
 * HTTPS certificates validate normally; only the destination IP is
 * pinned. Caller is responsible for closing the agent (await
 * agent.close()) when the request finishes. */
function pinnedAgent(pinnedIp: string): Agent {
  const family: 4 | 6 = net.isIPv6(pinnedIp) ? 6 : 4;
  return new Agent({
    connect: {
      lookup: (_hostname, _options, callback) => {
        callback(null, pinnedIp, family);
      },
    },
  });
}

/* Authoritative nameserver lookup for failure-clustering. Bounded by
 * a 1.5s timeout (DNS NS lookups normally complete in <100ms; this
 * keeps the validation step from blocking on a misbehaving resolver).
 * Returns the lowercased NS hostnames; null on error or empty result. */
async function lookupNameservers(hostname: string): Promise<string[] | null> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || net.isIP(hostname)) return null;
  try {
    const timer = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1_500),
    );
    const lookup = dns
      .resolveNs(hostname)
      .then((ns) => (Array.isArray(ns) ? ns.map((n) => n.toLowerCase()) : null))
      .catch(() => null);
    const result = await Promise.race([lookup, timer]);
    return Array.isArray(result) && result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

/* WAF-signature heuristic: connection-blocked failures that resolve
 * faster than ~100ms are almost always a WAF / anti-DDoS short-ban
 * rather than a real reachability problem. The threshold is generous
 * (real connection failures across continents can still be fast on
 * modern networks) but the combination connection-blocked + sub-100ms
 * is the actionable signal. */
const WAF_SIGNATURE_TIMING_MS = 100;

/* The fallback prober runs when both Vercel-egress attempts fail at
 * the connection level. Receives the URL we tried to reach and
 * returns true when the URL is reachable from a different egress
 * (Browserless's network in production). The prober is injected
 * rather than imported directly so url.ts has no dependency on
 * the screenshot service: this module stays pure-Node + undici. */
export type ValidateUrlOptions = {
  fallbackProber?: (url: string) => Promise<boolean>;
};

export async function validateUrl(
  normalized: string,
  options?: ValidateUrlOptions,
): Promise<UrlValidationResult> {
  const startedAt = Date.now();
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { valid: false, error: "URL is malformed." };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { valid: false, error: "URL uses an unsupported protocol." };
  }

  /* Pin the IP we resolved here for the actual fetch below. Without
   * this, fetch does its own DNS lookup at connect time and an
   * attacker controlling DNS (short TTL, multi-IP rotation) can
   * return a public IP for the validation lookup and 169.254.169.254
   * (or another private address) for the connect lookup. The pinned
   * agent below uses this exact IP regardless of what the URL
   * hostname resolves to at connect time. */
  const initialIp = await resolveToPublicIp(parsed.hostname);
  if (!initialIp) {
    /* Distinguish "DNS resolution failed entirely" from "DNS resolved
     * to a private IP". We do not block-list private resolution
     * results out of misconfiguration; that's a real SSRF guard
     * working as intended. */
    let dnsResolves = false;
    try {
      const records = await dns.lookup(parsed.hostname, { all: true });
      dnsResolves = records.length > 0;
    } catch {
      dnsResolves = false;
    }
    return {
      valid: false,
      error: dnsResolves
        ? "URL points to a private network."
        : "URL is not reachable.",
      diagnostic: {
        failureKind: dnsResolves ? "ssrf-blocked" : "dns-fail",
        httpStatus: null,
        serverHeader: null,
        nameservers: await lookupNameservers(parsed.hostname),
        attempts: 0,
        recoveredViaBrowserless: false,
        fastConnectionBlocked: false,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let current = parsed.toString();
  let pinnedIp = initialIp;
  let agent = pinnedAgent(pinnedIp);
  let hops = 0;
  let attempts = 0;
  const maxHops = 5;

  /* HEAD with realistic UA, GET-with-Range fallback if HEAD itself
   * throws (some CDNs reject HEAD outright), then a single 500ms-
   * spaced connection-level retry against the orthogonal case where
   * the TCP connection was torn down before any HTTP exchange (anti-
   * DDoS short-block, transient network blip). The first-attempt
   * cost is unchanged; the retry only fires when the upstream did
   * not return any response. AbortErrors propagate so the outer 10s
   * timeout still wins. */
  const fetchHop = async (): Promise<Response> => {
    attempts += 1;
    return fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": VALIDATE_URL_USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      // @ts-expect-error - dispatcher is undici-specific; supported by
      // Node's built-in fetch but not in the standard fetch RequestInit
      // type. Pinning the dispatcher per-hop closes DNS rebinding TOCTOU.
      dispatcher: agent,
    }).catch(async (err) => {
      if ((err as Error).name === "AbortError") throw err;
      return fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": VALIDATE_URL_USER_AGENT,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          range: "bytes=0-0",
        },
        // @ts-expect-error - see HEAD branch above
        dispatcher: agent,
      });
    });
  };

  /* Per-failure diagnostic builder. We resolve nameservers once
   * lazily on the first failure path that asks for it; success paths
   * skip the lookup entirely. */
  const buildDiagnostic = async (
    failureKind: ValidationFailureKind,
    httpStatus: number | null,
    serverHeader: string | null,
  ): Promise<UrlValidationDiagnostic> => {
    const durationMs = Date.now() - startedAt;
    const fastConnectionBlocked =
      failureKind === "connection-blocked" &&
      durationMs < WAF_SIGNATURE_TIMING_MS;
    return {
      failureKind,
      httpStatus,
      serverHeader,
      nameservers:
        failureKind === "ok"
          ? null
          : await lookupNameservers(parsed.hostname),
      attempts,
      recoveredViaBrowserless: false,
      fastConnectionBlocked,
      durationMs,
    };
  };

  try {
    while (hops < maxHops) {
      let res: Response;
      try {
        res = await fetchHop();
      } catch (err) {
        if ((err as Error).name === "AbortError") throw err;
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          res = await fetchHop();
        } catch (retryErr) {
          if ((retryErr as Error).name === "AbortError") throw retryErr;
          /* Both Vercel-egress attempts failed at the connection
           * level. Browserless runs from a different cloud
           * provider's egress IPs; if the upstream WAF only
           * temp-banned Vercel's range, Browserless will reach
           * the site cleanly. We never gate the screenshot
           * pipeline (which uses Browserless anyway) on validation
           * succeeding from Vercel's network, so a Browserless-
           * reachable / Vercel-blocked site is a real scan
           * candidate, not an unreachable one. */
          if (options?.fallbackProber) {
            try {
              const ok = await options.fallbackProber(current);
              if (ok) {
                let resolved = current;
                try {
                  const u = new URL(current);
                  u.search = "";
                  u.hash = "";
                  resolved = u.toString().replace(/\/$/, "");
                } catch {
                  /* keep current if reparse fails */
                }
                const diag = await buildDiagnostic(
                  "connection-blocked",
                  null,
                  null,
                );
                return {
                  valid: true,
                  resolvedUrl: resolved,
                  diagnostic: { ...diag, recoveredViaBrowserless: true },
                };
              }
            } catch (fallbackErr) {
              /* Fallback errors are inconclusive; fall through to
               * the failure path. */
              void fallbackErr;
            }
          }
          return {
            valid: false,
            error: "URL is not reachable.",
            diagnostic: await buildDiagnostic(
              "connection-blocked",
              null,
              null,
            ),
          };
        }
      }

      const serverHeader = res.headers.get("server");

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const next = new URL(location, current);
        if (!ALLOWED_PROTOCOLS.has(next.protocol)) {
          return {
            valid: false,
            error: "URL redirects to an unsupported protocol.",
            diagnostic: await buildDiagnostic(
              "redirect-blocked",
              res.status,
              serverHeader,
            ),
          };
        }
        /* Re-pin for the next hop so a redirect target also resolves
         * once and connects to that exact IP. Close the previous hop's
         * agent before swapping; agents hold sockets. */
        const nextIp = await resolveToPublicIp(next.hostname);
        if (!nextIp) {
          return {
            valid: false,
            error: "URL redirects into a private network.",
            diagnostic: await buildDiagnostic(
              "redirect-blocked",
              res.status,
              serverHeader,
            ),
          };
        }
        await agent.close();
        pinnedIp = nextIp;
        agent = pinnedAgent(pinnedIp);
        current = next.toString();
        hops += 1;
        continue;
      }

      if (res.status >= 400 && res.status !== 403 && res.status !== 405) {
        return {
          valid: false,
          error: `URL is not reachable (HTTP ${res.status}).`,
          diagnostic: await buildDiagnostic(
            "http-error",
            res.status,
            serverHeader,
          ),
        };
      }

      let resolved = current;
      try {
        const u = new URL(current);
        u.search = "";
        u.hash = "";
        resolved = u.toString().replace(/\/$/, "");
      } catch {
        /* keep current if reparse fails */
      }
      return {
        valid: true,
        resolvedUrl: resolved,
        diagnostic: await buildDiagnostic("ok", res.status, serverHeader),
      };
    }

    return {
      valid: false,
      error: "URL redirected too many times.",
      diagnostic: await buildDiagnostic("redirect-loop", null, null),
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return {
        valid: false,
        error: "URL did not respond within 10 seconds.",
        diagnostic: await buildDiagnostic("timeout", null, null),
      };
    }
    return {
      valid: false,
      error: "URL is not reachable.",
      diagnostic: await buildDiagnostic("unknown", null, null),
    };
  } finally {
    clearTimeout(timer);
    await agent.close().catch(() => { /* swallow agent-close errors */ });
  }
}
