"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

interface CanopyDeepDiveProps {
  /** Architectural-narrative body. Rendered with whitespace-pre-line so
   * the source string can use blank-line paragraph breaks. */
  body: string;
  /** Per-project hex accent already derived in the parent layout. Drives
   * the toggle border, fill, text color, the open-panel left rule, and
   * the optional Layer 3 link color so each project's section reads in
   * its own hue. */
  accent: string;
  /** Section heading, used for the screen-reader-only context inside the
   * toggle button label and inside the optional Layer 3 link. */
  sectionHeading: string;
  /** Optional Layer 3 page slug. When set, the open panel renders a
   * quiet "Read the full architecture of {heading} ->" link pointing at
   * /work/canopy/{pageSlug}. Inert when the slug is empty. */
  pageSlug?: string;
}

export function CanopyDeepDive({
  body,
  accent,
  sectionHeading,
  pageSlug,
}: CanopyDeepDiveProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const headerId = useId();
  const panelId = useId();

  return (
    <div className="mx-auto max-w-3xl mt-12 lg:mt-16">
      {/* Toggle pill. Bordered, accent-tinted, padded so it reads as a
          deliberate UI control rather than a quiet text link. Hidden on
          print so the printed PDF reads as a continuous document; the
          body itself is rendered unconditionally inside the print-only
          sibling below. */}
      <button
        type="button"
        id={headerId}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="print:hidden inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border-[1.5px] text-sm font-semibold transition-all duration-200 motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: accent,
          borderColor: `${accent}55`,
          backgroundColor: `${accent}0d`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${accent}1f`;
          e.currentTarget.style.borderColor = `${accent}99`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${accent}0d`;
          e.currentTarget.style.borderColor = `${accent}55`;
        }}
      >
        <span>{open ? "Hide the architecture" : "Read the architecture"}</span>
        <span className="sr-only"> for {sectionHeading}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}
          className="inline-flex"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {/* Screen-only animated panel. AnimatePresence handles mount/unmount
          so the closed state has zero DOM weight. Print is served by the
          static sibling below. The left accent rule visually separates
          the deep-dive zone from the surrounding L1 body. */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}
            className="overflow-hidden print:hidden"
          >
            <div className="pt-8 pb-2">
              <div
                className="border-l-2 pl-6 lg:pl-8"
                style={{ borderColor: `${accent}55` }}
              >
                <p className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary whitespace-pre-line">
                  {body}
                </p>
                {pageSlug ? (
                  <Link
                    href={`/work/canopy/${pageSlug}`}
                    className="mt-6 inline-flex items-center text-sm font-semibold hover:underline"
                    style={{ color: accent }}
                  >
                    Read the full architecture of {sectionHeading} →
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Print-only static panel. Always renders the body so a printed
          case study includes the architectural depth even when the
          screen toggle was closed at print time. The Layer 3 link is
          rendered as plain text reference rather than a clickable link
          since paper has no concept of href. */}
      <div className="hidden print:block pt-6">
        <p className="text-[1.0625rem] leading-[1.85] text-text-secondary whitespace-pre-line">
          {body}
        </p>
        {pageSlug ? (
          <p className="mt-4 text-sm" style={{ color: accent }}>
            Continued at /work/canopy/{pageSlug}
          </p>
        ) : null}
      </div>
    </div>
  );
}
