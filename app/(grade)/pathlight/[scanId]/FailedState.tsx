"use client";

import Link from "next/link";
import type { ScanFailureKind } from "@/lib/types/scan";

/**
 * Smart scan-failed state.
 *
 * Replaces the legacy generic "Something went wrong" card with a
 * cause-specific headline + body + next-step block routed off the
 * persisted failureKind (migration 039). The prospect sees plain
 * English about whether the issue is on their side (DNS missing,
 * WAF blocking, site overloaded, redirect loop) or on Pathlight's
 * side (post-validation pipeline error), plus a concrete next
 * action they can take from the same page.
 *
 * Voice posture: first-person "I", confident not apologetic, never
 * pretends the user did something wrong, never blames the prospect.
 * Mirrors Joshua's standing brand voice. Zero em dashes anywhere.
 *
 * Failure-state copy is keyed off the persisted ScanFailureKind so
 * pre-migration scans (or anything stamped with `unknown`) cleanly
 * fall through to a generic-but-still-actionable card. Adding new
 * kinds later is forward-compatible: a kind not in the map shows
 * the unknown copy until the operator adds an entry.
 */

type FailureCopy = {
  /* Headline shown in the red card. Stays under ~70 characters so
   * it fits the card width on small mobile viewports without
   * orphan-wrapping the last word. */
  headline: string;
  /* Two or three sentences explaining what happened in plain
   * English. References "your site" / "the scanner" naturally;
   * never names internal pipeline steps. */
  body: (ctx: FailureCopyContext) => string;
  /* One-line directive of what the prospect should do next. */
  nextStep: string;
  /* Accent the card border / heading. Not all failures are red;
   * something like a redirect loop is a yellow informational
   * tone, while a pipeline-error is amber to signal "our side." */
  tone: "red" | "amber" | "yellow";
};

type FailureCopyContext = {
  hostname: string | null;
  url: string;
};

const COPY: Record<ScanFailureKind, FailureCopy> = {
  "connection-blocked": {
    tone: "amber",
    headline: "Your site is up, but a security layer blocked the scanner.",
    body: ({ hostname }) =>
      `I tried reaching ${
        hostname ?? "your site"
      } from two different networks and the upstream tore the connection down before any HTTP exchange completed. That is the signature of a shared-host WAF (CloudFlare, Sucuri, GoDaddy's anti-DDoS, similar) noticing an automated tool. Your site itself is fine. Most short-bans clear within a few minutes.`,
    nextStep:
      "Try again in a moment, or paste a different URL if you want to look at another site first.",
  },
  "dns-fail": {
    tone: "red",
    headline: "I could not find that domain.",
    body: ({ hostname }) =>
      `DNS lookups for ${
        hostname ?? "the domain"
      } returned nothing. That usually means a typo in the URL, an expired registration, or DNS records that have not propagated yet for a recently-launched site.`,
    nextStep: "Double-check the URL and try again.",
  },
  "ssrf-blocked": {
    tone: "red",
    headline: "That URL points to a private network.",
    body: () =>
      `Pathlight only scans public sites. The address resolved to a private or internal range, which my scanner refuses for security reasons.`,
    nextStep: "Paste the public-facing URL of your site.",
  },
  "http-error": {
    tone: "amber",
    headline: "Your site responded, but with an error status.",
    body: ({ hostname }) =>
      `${
        hostname ?? "Your site"
      } returned an HTTP error response when I tried to load the page for analysis. That can mean the page is configured to block automated checks, the URL points at a deleted page, or the site is having server-side problems right now.`,
    nextStep:
      "Try the canonical homepage URL, or wait a few minutes and try again if your site looked normal in a browser when you last checked.",
  },
  timeout: {
    tone: "amber",
    headline: "Your site took too long to respond.",
    body: ({ hostname }) =>
      `I waited 10 seconds and ${
        hostname ?? "the site"
      } never sent a response. If the site is normally slow, that is one of the things Pathlight is built to find, but I need to reach it first. If it is normally fast, the host may be having a moment.`,
    nextStep: "Try again. If it keeps timing out, the site may be down.",
  },
  "redirect-loop": {
    tone: "yellow",
    headline: "Your URL bounces through too many redirects.",
    body: ({ hostname }) =>
      `I followed ${
        hostname ?? "your URL"
      } through five redirects without reaching a final page. That usually means a misconfigured redirect chain pointing back at itself.`,
    nextStep: "Paste your canonical homepage URL directly.",
  },
  "redirect-blocked": {
    tone: "yellow",
    headline: "Your URL redirects somewhere I cannot scan.",
    body: () =>
      `I followed your URL but the redirect target was either a private network address or a protocol my scanner does not support.`,
    nextStep: "Paste the actual public homepage URL directly.",
  },
  malformed: {
    tone: "red",
    headline: "That URL did not parse.",
    body: () =>
      `The address you pasted did not look like a valid web URL.`,
    nextStep: "The format should look like https://yoursite.com",
  },
  protocol: {
    tone: "red",
    headline: "Pathlight only scans http and https URLs.",
    body: () =>
      `The address you pasted used a protocol I do not scan.`,
    nextStep: "Try again with an https://... URL.",
  },
  "pipeline-error": {
    tone: "amber",
    headline: "I reached your site, but the analysis step hit a snag.",
    body: ({ hostname }) =>
      `${
        hostname ?? "Your site"
      } loaded fine, but something downstream of the page capture failed. This one is on my end, not your site's.`,
    nextStep:
      "Try again. If it keeps failing, email joshua@dbjtechnologies.com and I will run it personally.",
  },
  unknown: {
    tone: "red",
    headline: "Something went wrong with the scan.",
    body: () => `I hit an unexpected issue and could not finish the analysis.`,
    nextStep:
      "Try again. If this keeps happening, email joshua@dbjtechnologies.com and I will look at it personally.",
  },
};

const TONE_STYLES: Record<
  FailureCopy["tone"],
  { borderColor: string; backgroundColor: string; headlineColor: string }
> = {
  red: {
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(127,29,29,0.12)",
    headlineColor: "#fca5a5",
  },
  amber: {
    borderColor: "rgba(245,158,11,0.35)",
    backgroundColor: "rgba(120,53,15,0.15)",
    headlineColor: "#fcd34d",
  },
  yellow: {
    borderColor: "rgba(234,179,8,0.35)",
    backgroundColor: "rgba(133,77,14,0.12)",
    headlineColor: "#fde68a",
  },
};

function safeHostname(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function FailedState({
  url,
  failureKind,
  fallbackMessage,
}: {
  url: string;
  failureKind: ScanFailureKind | null;
  /* Sanitized error message from /api/scan/[scanId]. Used as a
   * defensive subline only; the kind-routed body is the primary
   * voice. We never render the raw error_message verbatim because
   * it can leak provider internals (Browserless 502 details, etc.)
   * even after sanitizeScanError. */
  fallbackMessage: string | null;
}) {
  /* Pre-migration scans + non-classified failures both fall through
   * to the unknown copy. The fallbackMessage shows below as a small
   * subline so the prospect still sees something specific when the
   * sanitizer surfaced a useful hint. */
  const kind: ScanFailureKind = failureKind ?? "unknown";
  const copy = COPY[kind] ?? COPY.unknown;
  const hostname = safeHostname(url);
  const tone = TONE_STYLES[copy.tone];

  /* Some failure kinds want the prospect to fix the URL before
   * retrying (typo / wrong path / behind a redirect they should
   * skip). Those route the primary CTA to the form with the URL
   * pre-filled so the prospect can edit it. The connection-level
   * and pipeline-side failures route to a one-click retry that
   * just resubmits the same URL. */
  const editUrlBeforeRetry =
    kind === "dns-fail" ||
    kind === "ssrf-blocked" ||
    kind === "redirect-loop" ||
    kind === "redirect-blocked" ||
    kind === "malformed" ||
    kind === "protocol" ||
    kind === "http-error";

  /* Both retry-flow buttons land on the same URL: the form picks up
   * the prefilled URL and the prospect can edit before submitting.
   * The button copy differs so the prospect knows whether the
   * recommended next step is "click submit again" or "fix the URL
   * first" before retrying. */
  const retryHref = `/pathlight?url=${encodeURIComponent(url)}`;
  const freshHref = "/pathlight";

  return (
    <section className="mx-auto max-w-xl py-20 text-center">
      <p
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Pathlight scan
      </p>
      <h1
        className="mt-2 break-all font-display text-2xl font-semibold sm:text-3xl"
        style={{ color: "#e7ebf2" }}
      >
        {url}
      </h1>
      <div
        className="mt-10 rounded-2xl border p-8 text-left"
        style={{
          borderColor: tone.borderColor,
          backgroundColor: tone.backgroundColor,
        }}
      >
        <div
          className="font-display text-xl font-semibold leading-snug sm:text-2xl"
          style={{ color: tone.headlineColor }}
        >
          {copy.headline}
        </div>
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "#e7ebf2" }}
        >
          {copy.body({ hostname, url })}
        </p>
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "#cbd5e1" }}
        >
          {copy.nextStep}
        </p>
        {fallbackMessage && fallbackMessage !== copy.headline ? (
          <p
            className="mt-4 text-xs italic"
            style={{ color: "#94a3b8" }}
          >
            Diagnostic note: {fallbackMessage}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={retryHref}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
              color: "white",
            }}
          >
            {editUrlBeforeRetry
              ? "Edit URL and try again"
              : "Try this URL again"}
          </Link>
          <Link
            href={freshHref}
            className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold"
            style={{
              borderColor: "rgba(148,163,184,0.4)",
              color: "#e7ebf2",
            }}
          >
            Scan a different URL
          </Link>
        </div>
      </div>
    </section>
  );
}
