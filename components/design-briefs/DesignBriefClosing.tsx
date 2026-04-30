"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DesignBriefMeta } from "@/lib/design-briefs";

interface DesignBriefClosingProps {
  accent: string;
  related: DesignBriefMeta[];
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

export function DesignBriefClosing({ accent, related }: DesignBriefClosingProps) {
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

  const cardStagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const card: Variants = {
    hidden: reduced
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 24, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: reduced ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <section className="relative py-20 lg:py-28 border-t border-text-primary/10 bg-bg-secondary/40">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger}
          className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-20 items-start"
        >
          <div>
            <motion.p
              variants={item}
              className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
              style={{ color: accent }}
            >
              Build It For Real
            </motion.p>
            <motion.h3
              variants={item}
              className="font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-bold leading-[1.12] tracking-tight mb-6"
            >
              Want this architecture, executed for your practice?
            </motion.h3>
            <motion.p
              variants={item}
              className="text-text-secondary leading-relaxed mb-8 lg:text-lg"
            >
              I build the version of this that ships. Designed end to end,
              launched on production grade infrastructure, with the surfaces
              above tuned to your actual book of business.
            </motion.p>
            <motion.div variants={item}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: accent }}
              >
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>

          <div>
            <motion.div
              variants={item}
              className="flex items-baseline justify-between mb-5"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Other Briefs
              </p>
              <Link
                href="/work"
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text-primary transition-colors"
              >
                View All →
              </Link>
            </motion.div>
            <motion.div
              variants={cardStagger}
              className="grid sm:grid-cols-3 gap-4 lg:gap-5"
            >
              {related.map((m) => (
                <motion.div
                  key={m.slug}
                  variants={card}
                  whileHover={
                    reduced
                      ? undefined
                      : {
                          y: -8,
                          transition: { duration: 0.35, ease: EASE_OUT },
                        }
                  }
                >
                  <Link
                    href={`/work/design-briefs/${m.slug}`}
                    className="group relative block rounded-xl overflow-hidden border bg-bg-primary"
                    style={{
                      borderColor: `${m.paletteAccent}26`,
                      boxShadow: [
                        "inset 0 1px 0 rgba(255,255,255,0.85)",
                        "0 1px 2px rgba(0,0,0,0.04)",
                        `0 10px 28px -12px ${m.paletteAccent}25`,
                        `0 28px 56px -28px ${m.paletteAccent}15`,
                      ].join(", "),
                    }}
                  >
                    {/* Hover halo behind card */}
                    <span
                      className="absolute -inset-px rounded-xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                      style={{
                        boxShadow: [
                          `0 28px 64px -16px ${m.paletteAccent}55`,
                          `0 64px 128px -32px ${m.paletteAccent}28`,
                          `0 0 0 1px ${m.paletteAccent}40`,
                        ].join(", "),
                      }}
                      aria-hidden="true"
                    />
                    {/* Top edge highlight, tinted with the brief's accent */}
                    <div
                      className="absolute top-0 left-4 right-4 h-px pointer-events-none z-10"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${m.paletteAccent}88 50%, transparent 100%)`,
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute top-0 left-4 right-4 h-px pointer-events-none z-10 opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
                      <Image
                        src={m.preview}
                        alt={`${m.vertical} brief preview`}
                        fill
                        className="object-cover object-top motion-safe:group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                        sizes="(max-width: 640px) 100vw, 240px"
                      />
                    </div>
                    <div className="p-4 relative">
                      <div
                        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1.5"
                        style={{ color: m.paletteAccent }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: m.paletteAccent }}
                          aria-hidden="true"
                        />
                        Design Brief
                      </div>
                      <div className="font-display text-base font-bold leading-tight motion-safe:group-hover:underline underline-offset-4 decoration-1 decoration-text-primary/60">
                        {m.vertical}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
