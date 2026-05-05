"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { StatCallout } from "@/components/sections/StatCallout";
import { PullQuote } from "@/components/sections/PullQuote";
import { SidebarTOC } from "@/components/sections/SidebarTOC";
import { Sources } from "@/components/sections/Sources";
import { accentMap } from "@/lib/page-system/accent-map";
import type { PageConfig, SourceEntry } from "@/lib/page-system/types";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type EditorialBreak =
  | {
      kind: "stat";
      value: string;
      label: string;
      source: { name: string; url?: string };
    }
  | { kind: "quote"; quote: string; attribution?: string };

export interface EditorialSection {
  id: string;
  heading: string;
  body: ReactNode;
  break?: EditorialBreak;
}

export interface EditorialHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  stat?: { value: string; label: string; source: { name: string; url?: string } };
}

export interface EditorialCTA {
  eyebrow: string;
  headline: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

interface EditorialLayoutProps {
  config: PageConfig;
  hero: EditorialHero;
  sections: EditorialSection[];
  faq: { question: string; answer: string }[];
  cta: EditorialCTA;
  sources: SourceEntry[];
  backLink?: { label: string; href: string };
}

export function EditorialLayout({
  config,
  hero,
  sections,
  faq,
  cta,
  sources,
  backLink,
}: EditorialLayoutProps) {
  const reduced = useReducedMotion();
  const a = accentMap[config.accent];
  const tocSections = sections.map((s) => ({ id: s.id, label: s.heading }));

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  const densityClass =
    config.density === "spacious"
      ? "py-24 lg:py-32"
      : config.density === "dense"
        ? "py-12 lg:py-16"
        : "py-16 lg:py-24";

  const textureClass =
    config.texture === "geometric"
      ? "page-texture-geometric"
      : config.texture === "tinted"
        ? "page-texture-tinted"
        : "";

  return (
    <article className={`relative ${textureClass}`}>
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${a.hex} 0%, transparent 65%)`,
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

            <div className="mt-10 lg:mt-14 max-w-4xl">
              <motion.div
                variants={item}
                className="flex items-center gap-3 mb-7 flex-wrap"
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
                className="font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-bold leading-[1.04] tracking-tight mb-6"
              >
                {hero.title}
              </motion.h1>

              <motion.p
                variants={item}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-3xl"
              >
                {hero.subtitle}
              </motion.p>
            </div>

            {hero.stat && config.hero === "data-driven" ? (
              <motion.div variants={item} className="mt-12 lg:mt-16 max-w-3xl">
                <StatCallout
                  variant="hero"
                  value={hero.stat.value}
                  label={hero.stat.label}
                  source={hero.stat.source}
                  accent={config.accent}
                />
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className={`relative ${densityClass}`}>
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[220px_1fr] gap-12 lg:gap-20">
            <SidebarTOC sections={tocSections} accent={config.accent} />

            <div className="min-w-0">
              {sections.map((s, i) => (
                <article
                  key={s.id}
                  id={s.id}
                  className="mb-20 lg:mb-28 last:mb-0 scroll-mt-24"
                >
                  <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
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
                      className="h-[2px] flex-1"
                      style={{
                        background: `linear-gradient(90deg, ${a.hex} 0%, ${a.hex}11 100%)`,
                      }}
                    />
                  </div>

                  <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.6rem)] font-bold leading-[1.12] tracking-tight mb-8 lg:mb-10 max-w-4xl">
                    {s.heading}
                  </h2>

                  <div className="editorial-prose max-w-3xl">{s.body}</div>

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
