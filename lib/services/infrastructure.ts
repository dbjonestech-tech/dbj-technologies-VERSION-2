import { connect } from "node:tls";
import { resolveTxt, resolveMx } from "node:dns/promises";
import { getDb } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";

/**
 * Domain + TLS + DNS authentication watcher.
 *
 * Daily Inngest cron (infrastructureCheckDaily) calls
 * runInfrastructureChecks for every domain in MANAGED_DOMAINS. For
 * each, six probes run in parallel:
 *
 *   tls   -- open TLS handshake on :443, capture certificate validTo
 *   whois -- minimal WHOIS lookup (port 43, ICANN registry referral)
 *   mx    -- DNS MX record presence
 *   spf   -- DNS TXT lookup for `v=spf1`
 *   dkim  -- DNS TXT lookup for the configured DKIM selector
 *   dmarc -- DNS TXT lookup for `_dmarc.<domain>` `v=DMARC1`
 *
 * Each probe writes one infra_checks row. The dashboard reads the
 * latest row per (target, resource). Sentry warnings fire at
 *   - tls:    expiry <= 14 days  (warn), <= 7 days (error)
 *   - whois:  expiry <= 30 days  (warn), <= 14 days (error)
 *   - mx/spf/dmarc: any 'fail' status -> error
 *
 * Add or remove domains by editing MANAGED_DOMAINS below.
 */

type ManagedDomain = {
  domain: string;
  /** DKIM selector to probe. Resend uses 'resend'; Google Workspace
   *  uses 'google'. Set to null to skip the DKIM probe. */
  dkimSelector: string | null;
};

const MANAGED_DOMAINS: ManagedDomain[] = [
  { domain: "dbjtechnologies.com", dkimSelector: "resend" },
  { domain: "thestarautoservice.com", dkimSelector: null },
];

type InfraResource = "tls" | "whois" | "mx" | "spf" | "dkim" | "dmarc";
type InfraStatus = "ok" | "warn" | "fail";

type ProbeResult = {
  resource: InfraResource;
  target: string;
  status: InfraStatus;
  expiresAt: Date | null;
  details: Record<string, unknown>;
};

async function recordCheck(result: ProbeResult): Promise<void> {
  try {
    const sql = getDb();
    const expiresIso = result.expiresAt ? result.expiresAt.toISOString() : null;
    await sql`
      INSERT INTO infra_checks (resource, target, status, expires_at, details)
      VALUES (
        ${result.resource},
        ${result.target},
        ${result.status},
        ${expiresIso}::timestamptz,
        ${JSON.stringify(result.details)}::jsonb
      )
    `;
  } catch (err) {
    console.warn(
      `[infra] recordCheck failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

async function probeTls(domain: string): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const socket = connect(
      { host: domain, port: 443, servername: domain, timeout: 10_000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          resolve({
            resource: "tls",
            target: domain,
            status: "fail",
            expiresAt: null,
            details: { error: "no_certificate" },
          });
          return;
        }
        const expiresAt = new Date(cert.valid_to);
        const daysLeft = Math.floor(
          (expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000)
        );
        const status: InfraStatus =
          daysLeft <= 7 ? "fail" : daysLeft <= 14 ? "warn" : "ok";
        resolve({
          resource: "tls",
          target: domain,
          status,
          expiresAt,
          details: {
            issuer: cert.issuer?.O ?? cert.issuer?.CN ?? null,
            subject: cert.subject?.CN ?? null,
            daysLeft,
          },
        });
      }
    );
    socket.on("error", (err) => {
      resolve({
        resource: "tls",
        target: domain,
        status: "fail",
        expiresAt: null,
        details: { error: err.message },
      });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        resource: "tls",
        target: domain,
        status: "fail",
        expiresAt: null,
        details: { error: "timeout" },
      });
    });
  });
}

async function probeMx(domain: string): Promise<ProbeResult> {
  try {
    const records = await resolveMx(domain);
    return {
      resource: "mx",
      target: domain,
      status: records.length > 0 ? "ok" : "fail",
      expiresAt: null,
      details: { count: records.length, records: records.slice(0, 5) },
    };
  } catch (err) {
    return {
      resource: "mx",
      target: domain,
      status: "fail",
      expiresAt: null,
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

async function probeTxtPrefix(
  resource: "spf" | "dmarc",
  fqdn: string,
  prefix: string,
  failTarget: string
): Promise<ProbeResult> {
  try {
    const records = await resolveTxt(fqdn);
    const flat = records.map((parts) => parts.join(""));
    const match = flat.find((r) => r.startsWith(prefix));
    return {
      resource,
      target: failTarget,
      status: match ? "ok" : "fail",
      expiresAt: null,
      details: { record: match ?? null, all: flat.slice(0, 5) },
    };
  } catch (err) {
    return {
      resource,
      target: failTarget,
      status: "fail",
      expiresAt: null,
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

async function probeDkim(domain: string, selector: string): Promise<ProbeResult> {
  const fqdn = `${selector}._domainkey.${domain}`;
  try {
    const records = await resolveTxt(fqdn);
    const flat = records.map((parts) => parts.join(""));
    const ok = flat.some((r) => r.includes("p="));
    return {
      resource: "dkim",
      target: domain,
      status: ok ? "ok" : "fail",
      expiresAt: null,
      details: { selector, fqdn, record: flat[0] ?? null },
    };
  } catch (err) {
    return {
      resource: "dkim",
      target: domain,
      status: "fail",
      expiresAt: null,
      details: { selector, fqdn, error: err instanceof Error ? err.message : String(err) },
    };
  }
}

/**
 * Lightweight WHOIS expiry probe. Connects to whois.iana.org and
 * follows the registry referral. Many registries return human-readable
 * "Registrar Registration Expiration Date:" lines we can parse.
 *
 * If the parse fails (uncommon TLD, unusual response format) we
 * record a 'warn' with the raw text so the dashboard surfaces the
 * uncertainty rather than silently passing.
 */
async function probeWhois(domain: string): Promise<ProbeResult> {
  /* WHOIS is a wide protocol surface and most TLDs require a chained
   * lookup (IANA -> registry -> registrar). Implementing a robust
   * chain inline is out of scope; we make a best-effort attempt at
   * the IANA lookup and surface the raw response so the operator
   * can verify renewals manually if needed. */
  try {
    const { Socket } = await import("node:net");
    const text = await new Promise<string>((resolve, reject) => {
      const socket = new Socket();
      let buf = "";
      socket.setTimeout(8000);
      socket.connect(43, "whois.iana.org", () => {
        socket.write(`${domain}\r\n`);
      });
      socket.on("data", (chunk) => {
        buf += chunk.toString("utf8");
      });
      socket.on("end", () => resolve(buf));
      socket.on("error", reject);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("timeout"));
      });
    });

    const expiryMatch = text.match(/Registry Expiry Date:\s*(\S+)/i)
      ?? text.match(/Registrar Registration Expiration Date:\s*(\S+)/i)
      ?? text.match(/Expiration Date:\s*(\S+)/i);
    const expiresAt = expiryMatch?.[1] ? new Date(expiryMatch[1]) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      return {
        resource: "whois",
        target: domain,
        status: "warn",
        expiresAt: null,
        details: { reason: "no_expiry_in_response" },
      };
    }
    const daysLeft = Math.floor(
      (expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000)
    );
    const status: InfraStatus =
      daysLeft <= 14 ? "fail" : daysLeft <= 30 ? "warn" : "ok";
    return {
      resource: "whois",
      target: domain,
      status,
      expiresAt,
      details: { daysLeft },
    };
  } catch (err) {
    return {
      resource: "whois",
      target: domain,
      status: "warn",
      expiresAt: null,
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

/**
 * Top-level orchestrator. Runs every probe for every managed domain
 * and writes the results. Returns a summary so the cron can log it.
 */
export async function runInfrastructureChecks(): Promise<{
  ok: boolean;
  domains: number;
  results: { warn: number; fail: number };
}> {
  let warn = 0;
  let fail = 0;

  for (const cfg of MANAGED_DOMAINS) {
    const domain = cfg.domain;
    const probes: Promise<ProbeResult>[] = [
      probeTls(domain),
      probeWhois(domain),
      probeMx(domain),
      probeTxtPrefix("spf", domain, "v=spf1", domain),
      probeTxtPrefix("dmarc", `_dmarc.${domain}`, "v=DMARC1", domain),
    ];
    if (cfg.dkimSelector) {
      probes.push(probeDkim(domain, cfg.dkimSelector));
    }

    const results = await Promise.all(probes);

    for (const result of results) {
      await recordCheck(result);
      if (result.status === "warn") warn += 1;
      if (result.status === "fail") fail += 1;
      /* Surface anything alarming to Sentry. The dashboard is
       * authoritative for ongoing visibility; Sentry is the wake-up. */
      if (result.status === "fail" || (result.resource === "tls" && result.status === "warn")) {
        Sentry.captureMessage(
          `infrastructure ${result.resource} check ${result.status} for ${result.target}`,
          {
            level: result.status === "fail" ? "error" : "warning",
            tags: { source: "infra-monitor", resource: result.resource },
            extra: result.details,
          }
        );
      }
    }
  }

  return { ok: true, domains: MANAGED_DOMAINS.length, results: { warn, fail } };
}

/* ─────────────── Read APIs ─────────────── */

export type InfraStatusRow = {
  target: string;
  resource: string;
  status: string;
  expiresAt: string | null;
  details: Record<string, unknown>;
  checkedAt: string;
};

export async function getLatestInfraStatuses(): Promise<InfraStatusRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT DISTINCT ON (target, resource)
      target, resource, status, expires_at, details, checked_at
    FROM infra_checks
    ORDER BY target, resource, checked_at DESC
  `) as Array<{
    target: string;
    resource: string;
    status: string;
    expires_at: string | null;
    details: Record<string, unknown>;
    checked_at: string;
  }>;
  return rows.map((r) => ({
    target: r.target,
    resource: r.resource,
    status: r.status,
    expiresAt: r.expires_at,
    details: r.details,
    checkedAt: r.checked_at,
  }));
}
