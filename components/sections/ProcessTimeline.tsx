import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

export interface ProcessStep {
  number: string;
  title: string;
  duration?: string;
  body: string;
}

interface ProcessTimelineProps {
  steps: ProcessStep[];
  accent: AccentDominance;
}

export function ProcessTimeline({ steps, accent }: ProcessTimelineProps) {
  const a = accentMap[accent];
  return (
    <ol className="relative space-y-8 lg:space-y-10">
      <span
        aria-hidden="true"
        className="absolute left-[18px] top-2 bottom-2 w-px"
        style={{
          background: `linear-gradient(180deg, ${a.hex}, ${a.hex}33 80%, transparent)`,
        }}
      />
      {steps.map((step) => (
        <li key={step.number} className="relative pl-14">
          <span
            className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${a.hex}15`,
              color: a.hex,
              border: `1px solid ${a.hex}30`,
            }}
            aria-hidden="true"
          >
            {step.number}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
            <h3 className="font-display text-lg lg:text-xl font-bold text-text-primary">
              {step.title}
            </h3>
            {step.duration && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: a.hex }}
              >
                {step.duration}
              </span>
            )}
          </div>
          <p className="text-[15px] lg:text-base leading-relaxed text-text-secondary">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
