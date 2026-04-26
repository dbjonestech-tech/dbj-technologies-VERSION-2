import { promises as dns } from "node:dns";
import net from "node:net";

export type UrlValidationResult = {
  valid: boolean;
  error?: string;
  resolvedUrl?: string;
};

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

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

async function hostnameResolvesPublic(hostname: string): Promise<boolean> {
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

  if (!(await hostnameResolvesPublic(parsed.hostname))) {
    return { valid: false, error: "URL points to a private network." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let current = parsed.toString();
  let hops = 0;
  const maxHops = 5;

  try {
    while (hops < maxHops) {
      const res = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "PathlightBot/1.0 (+https://dbjtechnologies.com)",
        },
      }).catch(async (err) => {
        if ((err as Error).name === "AbortError") throw err;
        return fetch(current, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent": "PathlightBot/1.0 (+https://dbjtechnologies.com)",
            range: "bytes=0-0",
          },
        });
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const next = new URL(location, current);
        if (!ALLOWED_PROTOCOLS.has(next.protocol)) {
          return { valid: false, error: "URL redirects to an unsupported protocol." };
        }
        if (!(await hostnameResolvesPublic(next.hostname))) {
          return { valid: false, error: "URL redirects into a private network." };
        }
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
  }
}
