"use client";

import type {
  PageCritiqueResult,
  PageCta,
  PageCtaLocation,
} from "@/lib/types/scan";

/**
 * Stage 1 above-the-fold critique. Renders three blocks under a single
 * "Above the fold" section heading:
 *
 *   1. heroObservation: 3-5 sentence intro paragraph in first person.
 *   2. Headline rewrite block: current headline plus three alternatives.
 *   3. CTA inventory: ranked list with structural facts plus "Try this"
 *      callout per CTA.
 *
 * Renders only when pageCritique is present and at least one of the
 * three blocks has content. The data lands a few seconds after status
 * flips to complete (the underlying call runs post-email); the polling
 * loop in ScanStatus picks it up without requiring a refresh.
 *
 * Copy posture: first-person "I", no em dashes, no internal terminology.
 */

const LOCATION_LABEL: Record<PageCtaLocation, string> = {
  "above-the-fold-hero": "Hero",
  "above-the-fold-secondary": "Above the fold",
  navigation: "Navigation",
  "later-on-page": "Below the fold",
};

function visibilityTone(score: number): {
  label: string;
  color: string;
} {
  if (score >= 8) return { label: "Easy to find", color: "#22c55e" };
  if (score >= 5) return { label: "Findable", color: "#f59e0b" };
  return { label: "Hard to find", color: "#ef4444" };
}

function CtaCard({ cta }: { cta: PageCta }) {
  const tone = visibilityTone(cta.visibility);
  return (
    <article
      className="rounded-2xl border p-4 print-avoid-break"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="truncate text-base font-semibold"
            style={{ color: "#f8fafc" }}
            title={cta.text}
          >
            {`"${cta.text}"`}
          </h3>
          <span
            className="mt-1 inline-block text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#9aa3b2" }}
          >
            {LOCATION_LABEL[cta.location]}
          </span>
        </div>
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
      {cta.observation ? (
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "#cbd2dc" }}
        >
          {cta.observation}
        </p>
      ) : null}
      {cta.nextAction ? (
        <div
          className="mt-3 rounded-xl border-l-2 px-3 py-2"
          style={{
            borderColor: "rgba(34,197,94,0.6)",
            backgroundColor: "rgba(10,30,18,0.4)",
          }}
        >
          <span
            className="block text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#86efac" }}
          >
            Try this
          </span>
          <p className="mt-1 text-sm" style={{ color: "#e2e8f0" }}>
            {cta.nextAction}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function HeadlineBlock({
  current,
  alternatives,
}: {
  current: string;
  alternatives: PageCritiqueResult["headline"]["alternatives"];
}) {
  if (!current && alternatives.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-4 print-avoid-break"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <span
        className="block text-[10px] uppercase tracking-[0.18em]"
        style={{ color: "#9aa3b2" }}
      >
        Your hero headline today
      </span>
      <p
        className="mt-2 text-lg font-semibold"
        style={{ color: "#f8fafc" }}
      >
        {current ? `"${current}"` : "(no clear hero headline visible)"}
      </p>
      {alternatives.length > 0 ? (
        <>
          <span
            className="mt-5 block text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#9aa3b2" }}
          >
            Three alternatives I would test
          </span>
          <ol className="mt-3 flex flex-col gap-3">
            {alternatives.map((alt, idx) => (
              <li
                key={`${idx}-${alt.text}`}
                className="rounded-xl border-l-2 px-3 py-2"
                style={{
                  borderColor: "rgba(8,145,178,0.6)",
                  backgroundColor: "rgba(8,32,45,0.4)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "#e2e8f0" }}
                >
                  {alt.text}
                </p>
                {alt.rationale ? (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "#9aa3b2" }}
                  >
                    {alt.rationale}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

export function HeroCritiqueSection({
  pageCritique,
}: {
  pageCritique: PageCritiqueResult | null;
}) {
  if (!pageCritique) return null;
  const hasObservation = pageCritique.heroObservation.length > 0;
  const hasHeadline =
    pageCritique.headline.current.length > 0 ||
    pageCritique.headline.alternatives.length > 0;
  const hasCtas = pageCritique.ctas.length > 0;
  if (!hasObservation && !hasHeadline && !hasCtas) return null;

  return (
    <section>
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#6b7280" }}
      >
        Above the fold
      </h2>
      {hasObservation ? (
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "#cbd2dc" }}
        >
          {pageCritique.heroObservation}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3">
        {hasHeadline ? (
          <HeadlineBlock
            current={pageCritique.headline.current}
            alternatives={pageCritique.headline.alternatives}
          />
        ) : null}
        {hasCtas
          ? pageCritique.ctas.map((cta, idx) => (
              <CtaCard key={`${idx}-${cta.text}`} cta={cta} />
            ))
          : null}
      </div>
    </section>
  );
}
