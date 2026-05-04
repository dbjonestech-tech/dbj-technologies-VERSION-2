"use client";

import type {
  OgPreviewProblem,
  OgPreviewProblemSeverity,
  OgPreviewResult,
} from "@/lib/types/scan";

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
}: {
  flavor: "og" | "twitter";
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  hostnameLabel: string | null;
  imageAlt: string | null;
}) {
  const flavorLabel = flavor === "og" ? "Facebook / LinkedIn / Slack" : "Twitter / X";
  const headline = title ?? "(no title set)";
  const snippet = description ?? "(no description set)";
  const showImage = imageUrl !== null;
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
      {showImage ? (
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "1.91 / 1", backgroundColor: "#0f172a" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
            alt={imageAlt ?? headline}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="flex w-full items-center justify-center text-sm"
          style={{
            aspectRatio: "1.91 / 1",
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
          }}
        >
          No share image set. Cards render with no preview here.
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

export function OgPreviewSection({ preview }: { preview: OgPreviewResult | null }) {
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
        />
        {twitterDistinct ? (
          <PreviewCard
            flavor="twitter"
            title={twitterTitle}
            description={twitterDescription}
            imageUrl={twitterImage}
            hostnameLabel={ogHostname}
            imageAlt={meta.imageAlt}
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
