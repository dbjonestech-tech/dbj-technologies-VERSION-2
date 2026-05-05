import type { ReactNode } from "react";
import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

export interface ComparisonColumn {
  label: string;
  sublabel?: string;
  highlight?: boolean;
}

export interface ComparisonRow {
  label: string;
  values: ReactNode[];
}

interface ComparisonTableProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  caption?: string;
  source?: { name: string; url?: string };
  accent: AccentDominance;
}

export function ComparisonTable({
  columns,
  rows,
  caption,
  source,
  accent,
}: ComparisonTableProps) {
  const a = accentMap[accent];
  const hl = columns.findIndex((c) => c.highlight);

  return (
    <figure className="my-12 lg:my-16">
      <div className="hidden md:block">
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: hl >= 0 ? `${a.hex}22` : "rgba(0,0,0,0.06)",
            boxShadow: hl >= 0 ? `0 30px 80px -30px ${a.hex}22` : undefined,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary/40 border-b border-text-primary/10">
                <th
                  scope="col"
                  className="text-left font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted py-4 px-5 w-1/4"
                >
                  <span className="sr-only">Criterion</span>
                </th>
                {columns.map((c, i) => {
                  const isHL = i === hl;
                  return (
                    <th
                      key={c.label}
                      scope="col"
                      className="text-left py-4 px-5 align-bottom"
                      style={isHL ? { background: `${a.hex}0a` } : undefined}
                    >
                      <div
                        className="font-display font-semibold text-base lg:text-lg leading-tight"
                        style={isHL ? { color: a.hex } : undefined}
                      >
                        {c.label}
                      </div>
                      {c.sublabel ? (
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mt-1">
                          {c.sublabel}
                        </div>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr
                  key={ri}
                  className="border-b border-text-primary/5 last:border-0"
                  style={
                    ri % 2 === 1
                      ? { background: "rgba(0,0,0,0.015)" }
                      : undefined
                  }
                >
                  <th
                    scope="row"
                    className="text-left font-medium text-text-primary py-4 px-5 align-top"
                  >
                    {r.label}
                  </th>
                  {r.values.map((v, ci) => {
                    const isHL = ci === hl;
                    return (
                      <td
                        key={ci}
                        className="py-4 px-5 align-top text-text-secondary leading-snug"
                        style={isHL ? { background: `${a.hex}08` } : undefined}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {columns.map((c, ci) => {
          const isHL = ci === hl;
          return (
            <div
              key={c.label}
              className="rounded-2xl border p-5"
              style={{
                borderColor: isHL ? `${a.hex}33` : "rgba(0,0,0,0.08)",
                background: isHL ? `${a.hex}06` : undefined,
                boxShadow: isHL ? `0 20px 50px -20px ${a.hex}28` : undefined,
              }}
            >
              <div
                className="font-display font-semibold text-lg leading-tight"
                style={isHL ? { color: a.hex } : undefined}
              >
                {c.label}
              </div>
              {c.sublabel ? (
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mt-1 mb-4">
                  {c.sublabel}
                </div>
              ) : (
                <div className="mb-3" />
              )}
              <dl className="space-y-3 text-sm">
                {rows.map((r, ri) => (
                  <div key={ri}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1">
                      {r.label}
                    </dt>
                    <dd className="text-text-secondary leading-snug">
                      {r.values[ci]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {caption || source ? (
        <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          {caption ? <span>{caption}</span> : null}
          {caption && source ? <span> &middot; </span> : null}
          {source ? (
            <span>
              Source:{" "}
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-4 hover:text-text-primary transition-colors"
                >
                  {source.name}
                </a>
              ) : (
                source.name
              )}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
