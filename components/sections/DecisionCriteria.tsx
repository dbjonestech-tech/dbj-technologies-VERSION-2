import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

export interface DecisionOption {
  label: string;
  bullets: string[];
  highlight?: boolean;
}

interface DecisionCriteriaProps {
  options: DecisionOption[];
  accent: AccentDominance;
}

export function DecisionCriteria({ options, accent }: DecisionCriteriaProps) {
  const a = accentMap[accent];
  const cols = options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <figure className={`my-12 lg:my-16 grid gap-5 ${cols}`}>
      {options.map((o, i) => {
        const isHL = !!o.highlight;
        return (
          <div
            key={i}
            className="rounded-2xl border p-6 lg:p-7 h-full"
            style={{
              borderColor: isHL ? `${a.hex}33` : "rgba(0,0,0,0.08)",
              background: isHL ? `${a.hex}06` : undefined,
              boxShadow: isHL ? `0 20px 50px -20px ${a.hex}28` : undefined,
            }}
          >
            <div
              className="font-display font-semibold text-base lg:text-lg leading-tight mb-4"
              style={isHL ? { color: a.hex } : undefined}
            >
              {o.label}
            </div>
            <ul className="space-y-2.5 text-sm text-text-secondary leading-snug">
              {o.bullets.map((b, j) => (
                <li key={j} className="relative pl-4">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-px w-2.5"
                    style={{
                      background: isHL ? a.hex : "currentColor",
                      opacity: isHL ? 1 : 0.4,
                    }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </figure>
  );
}
