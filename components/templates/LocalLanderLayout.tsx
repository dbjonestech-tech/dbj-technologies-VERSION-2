"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { Sources } from "@/components/sections/Sources";
import { accentMap } from "@/lib/page-system/accent-map";
import type { PageConfig, SourceEntry } from "@/lib/page-system/types";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export interface LocalLanderHero {
  geoLabel: string;
  coords?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface LocalLanderSection {
  id: string;
  heading: string;
  body: ReactNode;
}

export interface LocalLanderCTA {
  eyebrow: string;
  headline: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

interface LocalLanderLayoutProps {
  config: PageConfig;
  hero: LocalLanderHero;
  sections: LocalLanderSection[];
  faq: { question: string; answer: string }[];
  cta: LocalLanderCTA;
  sources: SourceEntry[];
}

export function LocalLanderLayout({
  config,
  hero,
  sections,
  faq,
  cta,
  sources,
}: LocalLanderLayoutProps) {
  const reduced = useReducedMotion();
  const a = accentMap[config.accent];

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.07, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.65, ease: EASE_OUT },
    },
  };

  const densityClass =
    config.density === "spacious"
      ? "py-20 lg:py-28"
      : config.density === "dense"
        ? "py-10 lg:py-14"
        : "py-14 lg:py-20";

  const textureClass =
    config.texture === "geometric"
      ? "page-texture-geometric"
      : config.texture === "tinted"
        ? "page-texture-tinted"
        : "";

  return (
    <article className={`relative ${textureClass}`}>
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 30%, ${a.hex} 0%, transparent 65%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 dot-grid opacity-50 pointer-events-none"
        />
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-12">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={item}
              className="flex items-center gap-3 mb-6 flex-wrap"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: a.hex }}
                aria-hidden="true"
              />
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: a.hex }}
              >
                {hero.eyebrow}
              </span>
              {hero.coords ? (
                <>
                  <span className="text-text-muted/50" aria-hidden="true">
                    /
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                    {hero.coords}
                  </span>
                </>
              ) : null}
            </motion.div>

            <motion.div variants={item} className="mb-8 lg:mb-10">
              <span
                className="block font-display font-bold tracking-tight leading-[0.95] text-[clamp(3rem,9vw,7rem)]"
                style={{
                  background: `linear-gradient(180deg, ${a.hex} 0%, ${a.hex}aa 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {hero.geoLabel}
              </span>
            </motion.div>

            <div className="max-w-3xl">
              <motion.h1
                variants={item}
                className="font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-bold leading-[1.12] tracking-tight mb-5"
              >
                {hero.title}
              </motion.h1>

              <motion.p
                variants={item}
                className="text-base lg:text-lg text-text-secondary leading-[1.6]"
              >
                {hero.subtitle}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={`relative ${densityClass}`}>
        <div className="mx-auto max-w-[920px] px-6 lg:px-12">
          {sections.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className="mb-14 lg:mb-20 last:mb-0 scroll-mt-24"
            >
              <div className="flex items-center gap-4 mb-5 lg:mb-6">
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: a.hex }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1"
                  style={{
                    background: `linear-gradient(90deg, ${a.hex}55 0%, ${a.hex}11 100%)`,
                  }}
                />
              </div>
              <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-[1.16] tracking-tight mb-6 lg:mb-8 max-w-3xl">
                {s.heading}
              </h2>
              <div className="editorial-prose">{s.body}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${a.hex} 0%, transparent 65%)`,
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 lg:px-12 text-center">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
            style={{ color: a.hex }}
          >
            {cta.eyebrow}
          </p>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold tracking-tight mb-5">
            {cta.headline}
          </h2>
          <p className="text-text-secondary leading-relaxed mb-8 lg:text-lg max-w-2xl mx-auto">
            {cta.body}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={cta.primary.href}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
              style={{ backgroundColor: a.hex }}
            >
              {cta.primary.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {cta.secondary ? (
              <Link
                href={cta.secondary.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
              >
                {cta.secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {faq.length > 0 ? (
        <section className="bg-bg-secondary/50 py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-12">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-tight mb-8 lg:mb-10">
              Frequently asked
            </h2>
            <Accordion items={faq} />
          </div>
        </section>
      ) : null}

      <Sources sources={sources} />
    </article>
  );
}
