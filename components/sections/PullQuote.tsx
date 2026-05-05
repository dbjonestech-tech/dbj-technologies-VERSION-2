import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

interface PullQuoteProps {
  quote: string;
  attribution?: string;
  accent: AccentDominance;
}

export function PullQuote({ quote, attribution, accent }: PullQuoteProps) {
  const a = accentMap[accent];
  return (
    <figure className="my-16 lg:my-20 mx-auto max-w-3xl text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-6 h-px w-24"
        style={{
          background: `linear-gradient(90deg, transparent, ${a.hex}, transparent)`,
        }}
      />
      <blockquote className="font-display text-[clamp(1.4rem,2.4vw,1.85rem)] leading-[1.35] tracking-tight text-text-primary">
        <span aria-hidden="true" style={{ color: a.hex }} className="mr-1.5">
          &ldquo;
        </span>
        {quote}
        <span aria-hidden="true" style={{ color: a.hex }} className="ml-1">
          &rdquo;
        </span>
      </blockquote>
      {attribution ? (
        <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
          {attribution}
        </figcaption>
      ) : null}
      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-px w-24"
        style={{
          background: `linear-gradient(90deg, transparent, ${a.hex}, transparent)`,
        }}
      />
    </figure>
  );
}
