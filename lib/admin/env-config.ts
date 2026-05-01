/**
 * Declarative catalog of every environment variable the admin
 * dashboard depends on. The `/admin/config` page introspects this
 * list against `process.env` at request time and renders a self-
 * service status board so the operator never has to grep the
 * codebase to find out which vars are still missing in Vercel.
 *
 * IMPORTANT: this file declares names and metadata only. Values
 * are never imported, never rendered, never logged. The page
 * shows "set" or "missing", nothing else.
 */

export type EnvVarRequirement = "required" | "recommended" | "optional";

export type EnvVarSpec = {
  /** Variable name as it appears in process.env. */
  name: string;
  /** Human-readable group: which feature/page depends on this. */
  group: string;
  /** Required = pages or features will error/blank without it.
   *  Recommended = present in production but not strictly required.
   *  Optional = nice-to-have. */
  requirement: EnvVarRequirement;
  /** One-sentence purpose. */
  description: string;
  /** Where to get the value (dashboard URL, CLI, etc). Optional. */
  whereToGet?: string;
  /** Pages that go blank/limited if this is missing. */
  affectedPages?: string[];
  /** True if the var name starts with NEXT_PUBLIC_ and is therefore
   *  visible to the browser; informational only. */
  isPublic?: boolean;
};

/* Vars are listed in roughly the order an operator would tackle
 * them: site fundamentals first, then per-page integrations. */
export const ADMIN_ENV_VARS: EnvVarSpec[] = [
  /* ─── Core site infrastructure ───────────────────── */
  {
    name: "POSTGRES_URL",
    group: "Database",
    requirement: "required",
    description: "Neon Postgres connection string. Powers every page that reads from the database (i.e. all of them).",
    whereToGet: "Vercel project -> Storage -> Neon -> .env tab",
    affectedPages: ["all"],
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    group: "Site",
    requirement: "required",
    description: "Canonical site URL used in metadata, redirects, and webhooks.",
    isPublic: true,
  },

  /* ─── Pathlight pipeline ─────────────────────────── */
  {
    name: "ANTHROPIC_API_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Claude API key for vision/remediation/revenue analysis and the chatbot.",
    whereToGet: "Anthropic console -> API keys",
    affectedPages: ["/admin/scans", "/admin/leads (indirect)"],
  },
  {
    name: "BROWSERLESS_API_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Headless Chrome for screenshots and Lighthouse runs.",
    whereToGet: "browserless.io dashboard",
  },
  {
    name: "BROWSERLESS_BASE_URL",
    group: "Pathlight pipeline",
    requirement: "optional",
    description: "Optional regional override. Defaults to production-sfo.",
  },
  {
    name: "PAGESPEED_API_KEY",
    group: "Pathlight pipeline",
    requirement: "recommended",
    description: "Raises the PSI quota. The pipeline works unauthenticated too, just with stricter limits.",
    whereToGet: "Google Cloud Console -> APIs & Services -> Credentials",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Upstash Redis for rate-limit + cache.",
    whereToGet: "Vercel marketplace -> Upstash integration",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Upstash Redis token (paired with URL above).",
  },
  {
    name: "INNGEST_EVENT_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Inngest event-publish key. Pipeline orchestration.",
    whereToGet: "Inngest dashboard -> Apps -> dbj-technologies -> Keys",
  },
  {
    name: "INNGEST_SIGNING_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Inngest signing key (verifies inbound webhooks from Inngest).",
  },
  {
    name: "RESEND_API_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Resend transactional email API. Pathlight reports + contact form.",
    whereToGet: "Resend dashboard -> API Keys",
  },
  {
    name: "RESEND_FROM_EMAIL",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Verified sender address. Domain must be authenticated in Resend.",
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Cloudflare Turnstile server-side verification.",
    whereToGet: "Cloudflare dashboard -> Turnstile",
  },
  {
    name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    group: "Pathlight pipeline",
    requirement: "required",
    description: "Cloudflare Turnstile site key. Public, used by the scan-form widget.",
    isPublic: true,
  },
  {
    name: "SENTRY_DSN",
    group: "Pathlight pipeline",
    requirement: "recommended",
    description: "Sentry DSN for runtime error capture. Distinct from SENTRY_AUTH_TOKEN below.",
  },

  /* ─── Pathlight audio (optional) ─────────────────── */
  {
    name: "ELEVENLABS_API_KEY",
    group: "Pathlight audio (optional)",
    requirement: "optional",
    description: "When set, scan reports include an AI-narrated audio summary.",
  },
  {
    name: "ELEVENLABS_VOICE_ID",
    group: "Pathlight audio (optional)",
    requirement: "optional",
    description: "ElevenLabs voice id for narration.",
  },
  {
    name: "ELEVENLABS_MODEL",
    group: "Pathlight audio (optional)",
    requirement: "optional",
    description: "ElevenLabs model id (defaults to a sensible fallback).",
  },
  {
    name: "BLOB_READ_WRITE_TOKEN",
    group: "Pathlight audio (optional)",
    requirement: "optional",
    description: "Vercel Blob token. Required if audio summaries are enabled (storage backend).",
  },

  /* ─── Contact form ───────────────────────────────── */
  {
    name: "CONTACT_EMAIL",
    group: "Contact form",
    requirement: "required",
    description: "Where contact-form submissions are delivered.",
  },
  {
    name: "CONTACT_FROM_EMAIL",
    group: "Contact form",
    requirement: "required",
    description: "From-address shown on contact-form delivery emails.",
  },
  {
    name: "CALENDLY_URL",
    group: "Contact form",
    requirement: "recommended",
    description: "Calendly booking URL surfaced on contact + thank-you pages.",
  },

  /* ─── Admin access ───────────────────────────────── */
  {
    name: "ADMIN_EMAILS",
    group: "Admin access",
    requirement: "required",
    description: "Comma-separated list of bootstrap admin emails. First entry is the bootstrap admin path before admin_users table is populated.",
    affectedPages: ["/admin (auth wall)"],
  },

  /* ─── Visitor analytics (privacy salt) ───────────── */
  {
    name: "ANALYTICS_IP_SALT_BASE",
    group: "Visitor analytics",
    requirement: "required",
    description: "32+ char random secret for the daily-rotating IP-hash salt in the visitor beacon. Without it, the beacon falls back to an insecure default and logs a warning.",
    whereToGet: "Run `openssl rand -hex 32` and paste the output",
    affectedPages: ["/admin/visitors", "/admin/recurring", "/admin/funnel"],
  },

  /* ─── /admin/costs ───────────────────────────────── */
  {
    name: "ANTHROPIC_ADMIN_KEY",
    group: "/admin/costs",
    requirement: "recommended",
    description: "Anthropic admin key. Powers the daily Claude API spend snapshot for the Costs page.",
    whereToGet: "Anthropic console -> Settings -> API keys -> Admin keys tab",
    affectedPages: ["/admin/costs"],
  },
  {
    name: "ANTHROPIC_MONTHLY_BUDGET_USD",
    group: "/admin/costs",
    requirement: "recommended",
    description: "Monthly USD budget cap. Drives headroom % and alert thresholds on the Costs page.",
    affectedPages: ["/admin/costs"],
  },

  /* ─── /admin/errors ──────────────────────────────── */
  {
    name: "SENTRY_AUTH_TOKEN",
    group: "/admin/errors",
    requirement: "recommended",
    description: "Sentry auth token. Powers the issues + events feed on the Errors page.",
    whereToGet: "Sentry -> Settings -> Account -> API -> Auth Tokens. Scopes: org:read project:read event:read",
    affectedPages: ["/admin/errors"],
  },
  {
    name: "SENTRY_ORG_SLUG",
    group: "/admin/errors",
    requirement: "recommended",
    description: "Sentry organization slug.",
    affectedPages: ["/admin/errors"],
  },
  {
    name: "SENTRY_PROJECT_SLUG",
    group: "/admin/errors",
    requirement: "recommended",
    description: "Sentry project slug.",
    affectedPages: ["/admin/errors"],
  },

  /* ─── /admin/platform ────────────────────────────── */
  {
    name: "VERCEL_API_TOKEN",
    group: "/admin/platform",
    requirement: "recommended",
    description: "Vercel API token. Powers the deployments feed on the Platform page.",
    whereToGet: "Vercel -> Account Settings -> Tokens. Read scope is enough.",
    affectedPages: ["/admin/platform"],
  },
  {
    name: "VERCEL_PROJECT_ID",
    group: "/admin/platform",
    requirement: "recommended",
    description: "The project to query.",
    whereToGet: "Vercel -> Project Settings -> General -> Project ID",
    affectedPages: ["/admin/platform"],
  },
  {
    name: "VERCEL_TEAM_ID",
    group: "/admin/platform",
    requirement: "optional",
    description: "Only required if the project lives under a Vercel team account.",
  },
  {
    name: "VERCEL_WEBHOOK_SECRET",
    group: "/admin/platform",
    requirement: "recommended",
    description: "Shared secret for the Vercel deployment webhook at /api/webhooks/vercel. Use the same value in the Vercel dashboard webhook config.",
    affectedPages: ["/admin/platform"],
  },

  /* ─── /admin/pipeline ────────────────────────────── */
  {
    name: "INNGEST_WEBHOOK_SECRET",
    group: "/admin/pipeline",
    requirement: "recommended",
    description: "Shared secret for the Inngest run-lifecycle webhook at /api/webhooks/inngest. Use the same value in the Inngest dashboard webhook config.",
    affectedPages: ["/admin/pipeline"],
  },

  /* ─── /admin/search ──────────────────────────────── */
  {
    name: "GOOGLE_SC_CREDENTIALS_JSON",
    group: "/admin/search",
    requirement: "recommended",
    description: "Full service-account JSON key (single line). The service-account email must be added as a Restricted user inside GSC -> Settings -> Users and permissions.",
    whereToGet: "Google Cloud Console -> IAM -> Service Accounts -> Keys -> Create new",
    affectedPages: ["/admin/search"],
  },
  {
    name: "GOOGLE_SC_SITE_URL",
    group: "/admin/search",
    requirement: "recommended",
    description: "Search Console property URL. Must match exactly what GSC shows (e.g. https://dbjtechnologies.com/).",
    affectedPages: ["/admin/search"],
  },
];

/**
 * Webhook endpoints that need to be registered on third-party
 * dashboards. The /admin/config page renders these alongside the
 * env-var status so the operator sees the full picture in one place.
 */
export type WebhookSpec = {
  name: string;
  url: string;
  registerAt: string;
  events: string;
  secretEnv: string;
  affectedPages: string[];
};

export const ADMIN_WEBHOOKS: WebhookSpec[] = [
  {
    name: "Vercel deployment lifecycle",
    url: "/api/webhooks/vercel",
    registerAt: "Vercel -> Project -> Settings -> Webhooks -> Add",
    events: "all deployment.* events",
    secretEnv: "VERCEL_WEBHOOK_SECRET",
    affectedPages: ["/admin/platform"],
  },
  {
    name: "Inngest run lifecycle",
    url: "/api/webhooks/inngest",
    registerAt: "Inngest -> Dashboard -> Webhooks (or Settings)",
    events: "all run-lifecycle events",
    secretEnv: "INNGEST_WEBHOOK_SECRET",
    affectedPages: ["/admin/pipeline"],
  },
  {
    name: "Resend email events",
    url: "/(grade)/api/webhooks/resend",
    registerAt: "Resend -> Webhooks -> Add",
    events: "email.delivered, email.bounced, email.complained, email.opened",
    secretEnv: "(none, signature in body)",
    affectedPages: ["/admin/email"],
  },
];

export type EnvVarStatus = {
  spec: EnvVarSpec;
  isSet: boolean;
};

/**
 * Server-only helper: read process.env for each declared var and
 * return whether it is set (non-empty string). Never returns or
 * exposes the actual value.
 */
export function checkEnvVarStatuses(): EnvVarStatus[] {
  return ADMIN_ENV_VARS.map((spec) => {
    const v = process.env[spec.name];
    const isSet = typeof v === "string" && v.trim().length > 0;
    return { spec, isSet };
  });
}

/**
 * Returns the set of distinct group labels in the order they first
 * appear in ADMIN_ENV_VARS.
 */
export function envGroups(): string[] {
  const seen: string[] = [];
  for (const v of ADMIN_ENV_VARS) {
    if (!seen.includes(v.group)) seen.push(v.group);
  }
  return seen;
}
