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
   * the toggle border, fill, halo, text color, the open-panel left rule,
   * and the optional Layer 3 link color so each project's section reads
   * in its own hue. */
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
  const [hovering, setHovering] = useState(false);
  const reduced = useReducedMotion();
  const headerId = useId();
  const panelId = useId();

  // Ambient halo runs only when the pill is closed and the user is not
  // hovering. Hover replaces the breathing loop with a brighter static
  // glow so the hover lift reads as a deliberate state change, not a
  // continuation of the idle loop. Reduced-motion disables both loops.
  const haloIdle = !reduced && !open && !hovering;
  const haloHover = !reduced && !open && hovering;

  return (
    <div className="mx-auto max-w-3xl mt-12 lg:mt-16 text-center">
      {/* Relative wrapper anchors the ambient halo behind the pill. */}
      <span className="relative inline-block">
        {/* Ambient halo. Soft accent glow that breathes on a slow loop
            so the toggle reads as alive without shouting. Hover swaps to
            a brighter static state and hands the visual feedback over to
            the pill's own border + background hover. */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none print:hidden"
          initial={{ opacity: 0, scale: 1 }}
          animate={
            haloIdle
              ? { opacity: [0.12, 0.32, 0.12], scale: [0.96, 1.06, 0.96] }
              : haloHover
                ? { opacity: 0.45, scale: 1.05 }
                : { opacity: 0, scale: 1 }
          }
          transition={
            haloIdle
              ? { duration: 4.5, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.35, ease: "easeOut" }
          }
          style={{
            backgroundColor: accent,
            filter: "blur(14px)",
            zIndex: -1,
          }}
        />

        {/* Pill. Bordered, accent-tinted, padded so it reads as a
            deliberate UI control rather than a quiet text link. Hidden on
            print so the printed PDF reads as a continuous document; the
            body itself is rendered unconditionally inside the print-only
            sibling below. */}
        <button
          type="button"
          id={headerId}
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
          aria-expanded={open}
          aria-controls={panelId}
          className="print:hidden relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border-[1.5px] text-sm font-semibold transition-all duration-200 motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: accent,
            borderColor: hovering ? `${accent}99` : `${accent}55`,
            backgroundColor: hovering ? `${accent}1f` : `${accent}0d`,
          }}
        >
          <span>{open ? "Hide the architecture" : "Read the architecture"}</span>
          <span className="sr-only"> for {sectionHeading}</span>
          {/* Chevron with two layered animations: an outer Y-bounce that
              loops only when the pill is idle (closed, not hovered, not
              reduced-motion), and an inner rotation that flips on
              open/close. Separating concerns keeps each animation
              self-consistent through state changes. */}
          <motion.span
            aria-hidden="true"
            className="inline-flex"
            animate={
              reduced || open || hovering
                ? { y: 0 }
                : { y: [0, 2, 0] }
            }
            transition={
              reduced || open || hovering
                ? { duration: 0.3, ease: "easeOut" }
                : {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                  }
            }
          >
            <motion.span
              className="inline-flex"
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </motion.span>
        </button>
      </span>

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
                className="border-l-2 pl-6 lg:pl-8 text-left"
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
      <div className="hidden print:block pt-6 text-left">
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
