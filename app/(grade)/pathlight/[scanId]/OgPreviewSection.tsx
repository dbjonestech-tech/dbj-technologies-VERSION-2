"use client";

import { useState } from "react";
import type {
  OgPreviewProblem,
  OgPreviewProblemSeverity,
  OgPreviewResult,
} from "@/lib/types/scan";

/* Image source for the OG / Twitter preview cards. We always route
 * through /api/og-image-proxy with the scanId binding rather than
 * setting <img src> directly to the third-party URL. Rationale: many
 * sites (Wix, Showit, Squarespace) hotlink-protect their og:image,
 * which fails with a foreign Referer. The proxy refetches with a
 * realistic UA and the originating site's Referer, so the preview
 * card mirrors what Facebook's scraper actually receives. The proxy
 * is bound to the scan's og_preview row server-side, so this is not
 * an open proxy. */
function proxyImageSrc(scanId: string, originalUrl: string): string {
  const params = new URLSearchParams({ scanId, url: originalUrl });
  return `/api/og-image-proxy?${params.toString()}`;
}

/**
 * Stage 3a social-share preview section. Renders three blocks:
 *
 *   1. A literal Facebook / LinkedIn / Slack-style card simulation showing
 *      the prospect what their site looks like when posted in a feed.
 *   2. A Twitter / X card simulation when distinct twitter:* metadata is
 *      present (otherwise the OG card already covers it).
 *   3. A list of detected structural problems with severity tones and
 *      one-line fixes the owner can ship today.
 *
 * Returns null when the og preview row is null (pre-Stage-3 scans, or any
 * scan whose html_snapshot did not land). When the row is present but
 * empty, still renders the "no metadata detected" empty state so the
 * prospect understands they have NO social-share preview at all -- which
 * is itself a real, actionable finding.
 *
 * Copy posture: first-person "I", no em dashes, no internal terminology.
 */

const SEVERITY_TONE: Record<
  OgPreviewProblemSeverity,
  { label: string; color: string }
> = {
  high: { label: "High impact", color: "#ef4444" },
  medium: { label: "Medium impact", color: "#f59e0b" },
  low: { label: "Low impact", color: "#22c55e" },
};

function hostnameFor(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toUpperCase();
  } catch {
    return null;
  }
}

function ProblemCard({ problem }: { problem: OgPreviewProblem }) {
  const tone = SEVERITY_TONE[problem.severity];
  return (
    <article
      className="rounded-2xl border p-4 print-avoid-break"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className="min-w-0 text-base font-semibold"
          style={{ color: "#f8fafc" }}
        >
          {problem.title}
        </h3>
        <span
          className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{
            borderColor: tone.color,
            color: tone.color,
            backgroundColor: "rgba(10,12,18,0.4)",
          }}
        >
          {tone.label}
        </span>
      </div>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "#cbd2dc" }}
      >
        {problem.detail}
      </p>
    </article>
  );
}

function PreviewCard({
  flavor,
  title,
  description,
  imageUrl,
  hostnameLabel,
  imageAlt,
  scanId,
}: {
  flavor: "og" | "twitter";
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  hostnameLabel: string | null;
  imageAlt: string | null;
  scanId: string;
}) {
  const flavorLabel = flavor === "og" ? "Facebook / LinkedIn / Slack" : "Twitter / X";
  const headline = title ?? "(no title set)";
  const snippet = description ?? "(no description set)";
  const showImage = imageUrl !== null;
  /* The proxy returns a transparent 1x1 placeholder PNG on any failure
   * path, so the <img> always loads. We still listen for the load
   * event to swap the visual to the "could not render" state when the
   * placeholder is detected (1px wide and 1px tall after layout). */
  const [imageFailed, setImageFailed] = useState(false);
  const proxiedSrc =
    showImage && imageUrl ? proxyImageSrc(scanId, imageUrl) : null;
  return (
    <article
      className="rounded-2xl border overflow-hidden print-avoid-break"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        className="px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
        style={{
          color: "#6b7280",
          backgroundColor: "#f3f4f6",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {flavorLabel} share preview
      </div>
      {showImage && proxiedSrc && !imageFailed ? (
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "1.91 / 1", backgroundColor: "#0f172a" }}
        >
          <img
            src={proxiedSrc}
            alt={imageAlt ?? headline}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
            onLoad={(e) => {
              const img = e.currentTarget;
              /* The proxy's failure-path placeholder is a transparent
               * 1x1 PNG. Detect via natural dimensions and treat as a
               * failed render so the card shows the "could not render"
               * state rather than a blank dark rectangle. */
              if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
                setImageFailed(true);
              }
            }}
          />
        </div>
      ) : showImage ? (
        /* og:image set in HTML but the proxy could not fetch it. The
         * tall rectangle here is intentional: this is a real failure
         * mode the prospect needs to fix, and showing it the same
         * vertical real estate as a working image makes the absence
         * visually loud. */
        <div
          className="flex w-full items-center justify-center px-4 text-center text-sm"
          style={{
            aspectRatio: "1.91 / 1",
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
          }}
        >
          The share image is set in your page metadata, but it did not
          load when fetched outside your site. Confirm the URL is
          publicly reachable.
        </div>
      ) : (
        /* No og:image at all in the HTML. Render a SHORT inline strip
         * instead of a full-aspect-ratio rectangle: real social
         * platforms collapse cards without an image to a compact
         * text-only layout, not a card-sized blank space, so the
         * giant placeholder rectangle was systematically over-stating
         * how broken the share looks. The strip keeps the prospect
         * informed without making the card visually look dead. */
        <div
          className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider"
          style={{
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          No preview image set
        </div>
      )}
      <div className="px-4 py-3">
        {hostnameLabel ? (
          <div
            className="text-[11px] uppercase tracking-wider"
            style={{ color: "#6b7280" }}
          >
            {hostnameLabel}
          </div>
        ) : null}
        <div
          className="mt-1 text-base font-semibold leading-snug"
          style={{ color: "#0f172a" }}
        >
          {headline}
        </div>
        <p
          className="mt-1 line-clamp-2 text-sm leading-snug"
          style={{ color: "#475569" }}
        >
          {snippet}
        </p>
      </div>
    </article>
  );
}

export function OgPreviewSection({
  preview,
  scanId,
}: {
  preview: OgPreviewResult | null;
  scanId: string;
}) {
  if (!preview) return null;
  const { meta, pageTitle, pageDescription, problems } = preview;

  /* Effective values used for the OG card preview: prefer og:* fields,
   * fall back to <title> / meta description so the simulation matches what
   * Facebook actually scrapes. */
  const ogTitle = meta.title ?? pageTitle;
  const ogDescription = meta.description ?? pageDescription;
  const ogImage = meta.image;
  const ogHostname = hostnameFor(meta.url);

  /* Render a separate Twitter card simulation only when the prospect set
   * distinct twitter:* values (a meaningful signal that they thought about
   * the Twitter share context). Otherwise the OG card already represents
   * what Twitter sees. */
  const twitterDistinct =
    (meta.twitterTitle && meta.twitterTitle !== meta.title) ||
    (meta.twitterDescription && meta.twitterDescription !== meta.description) ||
    (meta.twitterImage && meta.twitterImage !== meta.image);
  const twitterTitle = meta.twitterTitle ?? ogTitle;
  const twitterDescription = meta.twitterDescription ?? ogDescription;
  const twitterImage = meta.twitterImage ?? ogImage;

  return (
    <section className="mt-12">
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        When someone shares your site
      </h2>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "#cbd2dc" }}
      >
        I checked the meta tags that control how your link looks when it gets
        posted on Facebook, LinkedIn, Slack, or X. Here is what other people
        see in their feed today.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <PreviewCard
          flavor="og"
          title={ogTitle}
          description={ogDescription}
          imageUrl={ogImage}
          hostnameLabel={ogHostname}
          imageAlt={meta.imageAlt}
          scanId={scanId}
        />
        {twitterDistinct ? (
          <PreviewCard
            flavor="twitter"
            title={twitterTitle}
            description={twitterDescription}
            imageUrl={twitterImage}
            hostnameLabel={ogHostname}
            imageAlt={meta.imageAlt}
            scanId={scanId}
          />
        ) : null}
      </div>

      {problems.length > 0 ? (
        <div className="mt-6 grid gap-3 print-grid-expand">
          {problems.map((p, i) => (
            <ProblemCard key={`${p.severity}-${i}`} problem={p} />
          ))}
        </div>
      ) : (
        <div
          className="mt-6 rounded-2xl border p-4 text-sm"
          style={{
            borderColor: "rgba(34,197,94,0.4)",
            backgroundColor: "rgba(10,30,18,0.4)",
            color: "#bbf7d0",
          }}
        >
          Your share metadata looks clean. Every link posted to a social feed
          will render with a real title, description, and image.
        </div>
      )}
    </section>
  );
}
