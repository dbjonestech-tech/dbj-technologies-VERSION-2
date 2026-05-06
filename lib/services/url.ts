import { promises as dns } from "node:dns";
import net from "node:net";
import { Agent } from "undici";

export type UrlValidationResult = {
  valid: boolean;
  error?: string;
  resolvedUrl?: string;
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

export async function validateUrl(normalized: string): Promise<UrlValidationResult> {
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
    return { valid: false, error: "URL points to a private network." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let current = parsed.toString();
  let pinnedIp = initialIp;
  let agent = pinnedAgent(pinnedIp);
  let hops = 0;
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

  try {
    while (hops < maxHops) {
      let res: Response;
      try {
        res = await fetchHop();
      } catch (err) {
        if ((err as Error).name === "AbortError") throw err;
        await new Promise((resolve) => setTimeout(resolve, 500));
        res = await fetchHop();
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const next = new URL(location, current);
        if (!ALLOWED_PROTOCOLS.has(next.protocol)) {
          return { valid: false, error: "URL redirects to an unsupported protocol." };
        }
        /* Re-pin for the next hop so a redirect target also resolves
         * once and connects to that exact IP. Close the previous hop's
         * agent before swapping; agents hold sockets. */
        const nextIp = await resolveToPublicIp(next.hostname);
        if (!nextIp) {
          return { valid: false, error: "URL redirects into a private network." };
        }
        await agent.close();
        pinnedIp = nextIp;
        agent = pinnedAgent(pinnedIp);
        current = next.toString();
        hops += 1;
        continue;
      }

      if (res.status >= 400 && res.status !== 403 && res.status !== 405) {
        return { valid: false, error: `URL is not reachable (HTTP ${res.status}).` };
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
      return { valid: true, resolvedUrl: resolved };
    }

    return { valid: false, error: "URL redirected too many times." };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { valid: false, error: "URL did not respond within 10 seconds." };
    }
    return { valid: false, error: "URL is not reachable." };
  } finally {
    clearTimeout(timer);
    await agent.close().catch(() => { /* swallow agent-close errors */ });
  }
}
