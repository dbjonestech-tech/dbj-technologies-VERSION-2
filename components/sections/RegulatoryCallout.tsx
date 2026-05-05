import { ShieldCheck, Scale, Stethoscope, Lock, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

export type RegulatoryKind =
  | "legal"
  | "medical"
  | "accessibility"
  | "privacy"
  | "trust";

interface RegulatoryCalloutProps {
  kind: RegulatoryKind;
  title: string;
  body: string;
  source?: { name: string; url?: string };
  accent: AccentDominance;
}

const iconMap: Record<RegulatoryKind, LucideIcon> = {
  legal: Scale,
  medical: Stethoscope,
  accessibility: ShieldCheck,
  privacy: Lock,
  trust: AlertCircle,
};

export function RegulatoryCallout({
  kind,
  title,
  body,
  source,
  accent,
}: RegulatoryCalloutProps) {
  const a = accentMap[accent];
  const Icon = iconMap[kind];
  return (
    <aside
      className="relative rounded-2xl p-6 lg:p-7 not-prose"
      style={{
        background: `linear-gradient(160deg, ${a.hex}10, transparent 70%)`,
        border: `1px solid ${a.hex}26`,
      }}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${a.hex}18`,
            color: a.hex,
          }}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.22em] mb-1.5"
            style={{ color: a.hex }}
          >
            {kind === "legal"
              ? "Regulatory note"
              : kind === "medical"
                ? "Compliance note"
                : kind === "privacy"
                  ? "Privacy note"
                  : kind === "accessibility"
                    ? "Accessibility note"
                    : "Trust note"}
          </p>
          <h3 className="font-display text-lg lg:text-xl font-bold leading-tight text-text-primary mb-2">
            {title}
          </h3>
          <p className="text-[15px] leading-relaxed text-text-secondary">
            {body}
          </p>
          {source && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
              Source:{" "}
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                  style={{ color: a.hex }}
                >
                  {source.name}
                </a>
              ) : (
                <span>{source.name}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
