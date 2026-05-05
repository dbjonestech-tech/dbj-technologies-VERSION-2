import type { CaptureCaveat } from "@/lib/types/scan";

/**
 * Top-of-report "Notes on this analysis" section.
 *
 * Renders only when the cv1 step (lib/inngest/functions.ts) detected
 * at least one capture-confidence caveat applicable to this scan.
 * When the array is empty (cv1 ran, found nothing) or null (cv1 has
 * not run yet, or this is a pre-feature scan), the section is
 * suppressed and the report renders without it.
 *
 * Tone: confident, concrete, professional. The notice frames Pathlight
 * as a tool that knows the boundary between what its automated
 * capture can verify and what genuinely requires a real-browser look,
 * and names that boundary explicitly so the prospect calibrates the
 * rest of the report appropriately. The notice does NOT apologize,
 * does NOT mention models or scanner internals, does NOT shake the
 * reader's confidence in the substantive findings below it.
 *
 * Print-safe: the existing .print-avoid-break utility prevents the
 * notice from splitting across pages.
 */

const HEADLINE = "Notes on this analysis";
const INTRO =
  "A few things on this page are best verified in a real browser. I noted them up front so you can read the rest of the report with the right context.";

export function CaptureCaveatsNotice({
  caveats,
}: {
  caveats: CaptureCaveat[] | null;
}) {
  if (!caveats || caveats.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-5 print-avoid-break"
      style={{
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.55)",
      }}
      aria-label="Notes on this analysis"
    >
      <h2
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "#94a3b8" }}
      >
        {HEADLINE}
      </h2>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "#cbd5e1" }}
      >
        {INTRO}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {caveats.map((c, i) => (
          <li
            key={`${c.kind}-${i}`}
            className="rounded-xl border p-4 text-sm leading-relaxed"
            style={{
              borderColor: "rgba(148,163,184,0.18)",
              backgroundColor: "rgba(2,6,23,0.55)",
              color: "#e2e8f0",
            }}
          >
            {c.detail}
          </li>
        ))}
      </ul>
    </section>
  );
}
