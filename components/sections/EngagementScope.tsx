import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

interface EngagementScopeProps {
  accent: AccentDominance;
  timeline: { label: string; value: string };
  pricing: { label: string; value: string; note?: string };
  deliverables: string[];
  cta?: { label: string; href: string };
}

export function EngagementScope({
  accent,
  timeline,
  pricing,
  deliverables,
  cta,
}: EngagementScopeProps) {
  const a = accentMap[accent];
  return (
    <aside
      className="relative rounded-2xl p-6 lg:p-8 not-prose"
      style={{
        background: `linear-gradient(160deg, ${a.hex}08, transparent 60%)`,
        border: `1px solid ${a.hex}22`,
      }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em] mb-5"
        style={{ color: a.hex }}
      >
        Engagement scope
      </p>
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1.5">
            {timeline.label}
          </p>
          <p className="font-display text-xl lg:text-2xl font-bold text-text-primary">
            {timeline.value}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1.5">
            {pricing.label}
          </p>
          <p className="font-display text-xl lg:text-2xl font-bold text-text-primary">
            {pricing.value}
          </p>
          {pricing.note && (
            <p className="mt-1 text-xs text-text-muted leading-snug">
              {pricing.note}
            </p>
          )}
        </div>
        <div className="lg:col-span-1 col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1.5">
            Engagement
          </p>
          <p className="font-display text-xl lg:text-2xl font-bold text-text-primary">
            Solo principal
          </p>
          <p className="mt-1 text-xs text-text-muted leading-snug">
            Same person at pitch, build, and launch
          </p>
        </div>
      </div>
      <div className="border-t pt-5" style={{ borderColor: `${a.hex}22` }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-3">
          What you receive
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {deliverables.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed">
              <span
                className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: a.hex }}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:translate-x-0.5"
          style={{
            backgroundColor: a.hex,
            color: "#ffffff",
          }}
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </aside>
  );
}
