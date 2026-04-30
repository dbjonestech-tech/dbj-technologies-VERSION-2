"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface DesignBriefHeroProps {
  accent: string;
  vertical: string;
  position: number;
  total: number;
  headline: string;
  summary: string;
  preview: string;
  previewAlt?: string;
  sectionCount: number;
  loadBearingCount: number;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function DesignBriefHero({
  accent,
  vertical,
  position,
  total,
  headline,
  summary,
  preview,
  previewAlt,
  sectionCount,
  loadBearingCount,
}: DesignBriefHeroProps) {
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

  const heroImage: Variants = {
    hidden: reduced
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 36, scale: 0.985 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: reduced ? 0 : 1.0, ease: EASE_OUT },
    },
  };

  const halo: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.32,
      transition: { duration: reduced ? 0 : 1.6, ease: EASE_OUT, delay: 0.2 },
    },
  };

  return (
    <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
      {/* Subtle accent wash backdrop */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${accent} 0%, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={item}>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Work
            </Link>
          </motion.div>

          <div className="mt-12 lg:mt-16 max-w-4xl">
            <motion.div
              variants={item}
              className="flex items-center gap-3 mb-7 flex-wrap"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Design Brief
              </span>
              <span className="text-text-muted/50" aria-hidden="true">
                /
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {vertical}
              </span>
              <span className="text-text-muted/50" aria-hidden="true">
                /
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                {String(position).padStart(2, "0")} of{" "}
                {String(total).padStart(2, "0")}
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
            >
              {headline}
            </motion.h1>

            <motion.p
              variants={item}
              className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-2xl mb-10"
            >
              {summary}
            </motion.p>

            <motion.div
              variants={item}
              className="flex items-center gap-6 lg:gap-8 mb-10"
            >
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-display text-3xl lg:text-4xl font-bold leading-none"
                  style={{ color: accent }}
                >
                  {sectionCount}
                </span>
                <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Surfaces
                </span>
              </div>
              <div className="h-8 w-px bg-text-primary/15" aria-hidden="true" />
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-display text-3xl lg:text-4xl font-bold leading-none"
                  style={{ color: accent }}
                >
                  {loadBearingCount}
                </span>
                <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Load Bearing
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="flex flex-wrap items-center gap-x-6 gap-y-4"
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: accent }}
              >
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#brief"
                className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
              >
                Read the Brief
              </Link>
            </motion.div>
          </div>

          {/* Hero screenshot - full container width with halo */}
          <motion.div
            variants={heroImage}
            className="relative mt-16 lg:mt-20"
          >
            <motion.div
              variants={halo}
              className="absolute -inset-6 lg:-inset-10 -z-10 blur-3xl pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
              }}
              aria-hidden="true"
            />
            <div
              className="relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 transform-gpu"
              style={{
                borderColor: `${accent}55`,
                boxShadow: `0 50px 120px -30px ${accent}55, 0 25px 60px -20px rgba(0,0,0,0.22)`,
              }}
            >
              <Image
                src={preview}
                alt={previewAlt || `${vertical} reference architecture preview`}
                width={2400}
                height={1500}
                priority
                className="w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 1400px"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
