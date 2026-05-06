"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CanopyDeepDive } from "@/lib/canopy-deep-dives";

/* Canopy's gradient is from-cyan-500 to-blue-600. The hex tokens here
   match what deriveAccent / deriveHaloColors return inside
   ProjectDetailLayout, so deep-dive pages read in the same hue family
   as the parent /work/canopy case study. */
const ACCENT = "#06b6d4"; // cyan-500
const HALO_A = "#06b6d4"; // cyan-500
const HALO_B = "#2563eb"; // blue-600
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

interface CanopyDeepDiveLayoutProps {
  page: CanopyDeepDive;
}

export function CanopyDeepDiveLayout({ page }: CanopyDeepDiveLayoutProps) {
  const reduced = useReducedMotion();

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <article className="relative">
      {/* Hero */}
      <section className="relative pt-28 pb-12 lg:pt-32 lg:pb-16 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div
          className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${HALO_A} 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 20% 60%, ${HALO_B} 0%, transparent 60%)`,
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={item}>
              <Link
                href="/work/canopy"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Canopy case study
              </Link>
            </motion.div>

            <div className="mt-12 lg:mt-16 max-w-4xl">
              <motion.div
                variants={item}
                className="flex items-center gap-3 mb-7 flex-wrap"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Canopy Architecture
                </span>
                <span className="text-text-muted/50" aria-hidden="true">
                  /
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: ACCENT }}
                >
                  Deep Dive
                </span>
              </motion.div>

              <motion.h1
                variants={item}
                className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
              >
                {page.heading}
              </motion.h1>

              <motion.p
                variants={item}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-2xl"
              >
                {page.summary}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section divider, flush with hero */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}33 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Body, single long-form column */}
      <section className="relative py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: reduced ? 0 : 0.8, ease: EASE_OUT }}
            className="mx-auto max-w-3xl"
          >
            <p className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary whitespace-pre-line">
              {page.body}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tail navigation, back to /work/canopy + Get in Touch */}
      <section className="relative py-16 lg:py-20 border-t border-text-primary/10 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.p
              variants={item}
              className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
              style={{ color: ACCENT }}
            >
              Keep Reading
            </motion.p>
            <motion.h2
              variants={item}
              className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] font-bold leading-[1.2] tracking-tight mb-8"
            >
              The rest of the case study lives at /work/canopy.
            </motion.h2>
            <motion.div
              variants={item}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            >
              <Link
                href="/work/canopy"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: ACCENT }}
              >
                Back to Canopy
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact?topic=canopy"
                className="inline-flex items-center text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
              >
                Get in Touch
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </article>
  );
}
