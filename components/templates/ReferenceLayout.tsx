"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { PullQuote } from "@/components/sections/PullQuote";
import { StatCallout } from "@/components/sections/StatCallout";
import { SidebarTOC } from "@/components/sections/SidebarTOC";
import { Sources } from "@/components/sections/Sources";
import { accentMap } from "@/lib/page-system/accent-map";
import type { PageConfig, SourceEntry } from "@/lib/page-system/types";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type ReferenceBreak =
  | {
      kind: "stat";
      value: string;
      label: string;
      source: { name: string; url?: string };
    }
  | { kind: "quote"; quote: string; attribution?: string };

export interface ReferenceSection {
  id: string;
  heading: string;
  body: ReactNode;
  break?: ReferenceBreak;
}

export interface ReferenceHero {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface ReferenceCTA {
  eyebrow: string;
  headline: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

interface ReferenceLayoutProps {
  config: PageConfig;
  hero: ReferenceHero;
  sections: ReferenceSection[];
  faq: { question: string; answer: string }[];
  cta: ReferenceCTA;
  sources: SourceEntry[];
  backLink?: { label: string; href: string };
}

export function ReferenceLayout({
  config,
  hero,
  sections,
  faq,
  cta,
  sources,
  backLink,
}: ReferenceLayoutProps) {
  const reduced = useReducedMotion();
  const a = accentMap[config.accent];
  const tocSections = sections.map((s) => ({ id: s.id, label: s.heading }));

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: EASE_OUT },
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
      <section className="relative pt-28 pb-12 lg:pt-32 lg:pb-16 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 80% 20%, ${a.hex} 0%, transparent 65%)`,
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 lg:px-12">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {backLink ? (
              <motion.div variants={item}>
                <Link
                  href={backLink.href}
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  {backLink.label}
                </Link>
              </motion.div>
            ) : null}

            <div className="mt-8 lg:mt-10 max-w-4xl">
              <motion.div
                variants={item}
                className="flex items-center gap-3 mb-5 flex-wrap"
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
              </motion.div>

              <motion.h1
                variants={item}
                className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.06] tracking-tight mb-5"
              >
                {hero.title}
              </motion.h1>

              <motion.p
                variants={item}
                className="text-base lg:text-lg text-text-secondary leading-[1.6] max-w-3xl"
              >
                {hero.subtitle}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={`relative ${densityClass}`}>
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
            <SidebarTOC sections={tocSections} accent={config.accent} />

            <div className="min-w-0">
              {sections.map((s, i) => (
                <article
                  key={s.id}
                  id={s.id}
                  className="mb-16 lg:mb-24 last:mb-0 scroll-mt-24"
                >
                  <div className="flex items-center gap-4 lg:gap-6 mb-5 lg:mb-7">
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: a.hex }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                        Section
                      </span>
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.22em]"
                        style={{ color: a.hex }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted/60">
                        / {String(sections.length).padStart(2, "0")}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${a.hex}77 0%, ${a.hex}11 100%)`,
                      }}
                    />
                  </div>

                  <h2 className="font-display text-[clamp(1.55rem,2.8vw,2.25rem)] font-bold leading-[1.14] tracking-tight mb-7 lg:mb-9 max-w-4xl">
                    {s.heading}
                  </h2>

                  <div className="editorial-prose">{s.body}</div>

                  {s.break?.kind === "stat" ? (
                    <StatCallout
                      value={s.break.value}
                      label={s.break.label}
                      source={s.break.source}
                      accent={config.accent}
                    />
                  ) : null}
                  {s.break?.kind === "quote" ? (
                    <PullQuote
                      quote={s.break.quote}
                      attribution={s.break.attribution}
                      accent={config.accent}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {faq.length > 0 ? (
        <section className="bg-bg-secondary/50 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-12">
            <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-bold tracking-tight mb-10">
              Frequently asked
            </h2>
            <Accordion items={faq} />
          </div>
        </section>
      ) : null}

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

      <Sources sources={sources} />
    </article>
  );
}
