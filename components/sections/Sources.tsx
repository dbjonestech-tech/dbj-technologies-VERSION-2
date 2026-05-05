import type { SourceEntry } from "@/lib/page-system/types";

interface SourcesProps {
  sources: SourceEntry[];
}

export function Sources({ sources }: SourcesProps) {
  if (sources.length === 0) return null;
  return (
    <section
      id="sources"
      aria-labelledby="sources-heading"
      className="mx-auto max-w-3xl px-6 lg:px-12 py-16 lg:py-20 border-t border-text-primary/10"
    >
      <h2
        id="sources-heading"
        className="font-display text-2xl lg:text-3xl font-bold mb-8 tracking-tight"
      >
        Sources
      </h2>
      <ol className="space-y-4">
        {sources.map((s) => (
          <li
            key={s.id}
            className="flex gap-3 text-sm leading-relaxed text-text-secondary"
          >
            <span className="font-mono text-text-muted shrink-0 w-6 tabular-nums">
              {s.id}.
            </span>
            <span>
              {s.authors ? <span>{s.authors}. </span> : null}
              {!s.authors && s.org ? <span>{s.org}. </span> : null}
              <span className="font-mono tabular-nums text-text-muted">
                ({s.year}).
              </span>{" "}
              <span className="text-text-primary">{s.title}</span>
              {s.publication ? <span className="italic"> {s.publication}</span> : null}.{" "}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-text-primary transition-colors break-all"
              >
                {s.doi ?? s.url}
              </a>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
