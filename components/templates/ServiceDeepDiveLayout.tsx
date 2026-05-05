"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { ProcessTimeline, type ProcessStep } from "@/components/sections/ProcessTimeline";
import { EngagementScope } from "@/components/sections/EngagementScope";
import { Sources } from "@/components/sections/Sources";
import { PullQuote } from "@/components/sections/PullQuote";
import { StatCallout } from "@/components/sections/StatCallout";
import { accentMap } from "@/lib/page-system/accent-map";
import type {
  PageConfig,
  SourceEntry,
} from "@/lib/page-system/types";

export interface ServiceHero {
  eyebrow: string;
  title: string;
  highlight?: string;
  lede: string;
}

export interface ServiceSection {
  id: string;
  number: string;
  label: string;
  heading: string;
  body: ReactNode;
  break?:
    | { kind: "rule" }
    | { kind: "gradient-rule" }
    | {
        kind: "quote";
        quote: string;
        attribution?: string;
      }
    | {
        kind: "stat";
        value: string;
        label: string;
        source: { name: string; url?: string };
      };
}

export interface ServiceProcess {
  heading: string;
  lede?: string;
  steps: ProcessStep[];
}

export interface ServiceScope {
  timeline: { label: string; value: string };
  pricing: { label: string; value: string; note?: string };
  deliverables: string[];
}

export interface ServiceCTA {
  eyebrow: string;
  heading: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export interface ServiceDeepDiveLayoutProps {
  config: PageConfig;
  hero: ServiceHero;
  sections: ServiceSection[];
  process: ServiceProcess;
  scope: ServiceScope;
  faq: { question: string; answer: string }[];
  cta: ServiceCTA;
  sources: SourceEntry[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function SectionBreak({
  variant,
  accent,
}: {
  variant: ServiceSection["break"];
  accent: PageConfig["accent"];
}) {
  if (!variant) return null;
  const a = accentMap[accent];
  if (variant.kind === "rule") {
    return (
      <div className="my-14 lg:my-16 flex items-center gap-4">
        <span className="h-px flex-1" style={{ backgroundColor: `${a.hex}30` }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.32em]"
          style={{ color: a.hex }}
        >
          §
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: `${a.hex}30` }} />
      </div>
    );
  }
  if (variant.kind === "gradient-rule") {
    return (
      <div
        className="my-14 lg:my-16 h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${a.hex}55, transparent)`,
        }}
      />
    );
  }
  if (variant.kind === "quote") {
    return (
      <div className="my-16 lg:my-20">
        <PullQuote
          quote={variant.quote}
          attribution={variant.attribution}
          accent={accent}
        />
      </div>
    );
  }
  return (
    <div className="my-16 lg:my-20">
      <StatCallout
        variant="break"
        value={variant.value}
        label={variant.label}
        source={variant.source}
        accent={accent}
      />
    </div>
  );
}

export function ServiceDeepDiveLayout({
  config,
  hero,
  sections,
  process,
  scope,
  faq,
  cta,
  sources,
}: ServiceDeepDiveLayoutProps) {
  const reduce = useReducedMotion();
  const a = accentMap[config.accent];

  return (
    <main className="relative">
      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Services
          </Link>
          <motion.div
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.32em] mb-5"
              style={{ color: a.hex }}
            >
              {hero.eyebrow}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight text-text-primary">
              {hero.title}
              {hero.highlight && (
                <>
                  {" "}
                  <span style={{ color: a.hex }}>{hero.highlight}</span>
                </>
              )}
            </h1>
            <p className="mt-6 lg:mt-8 text-lg lg:text-xl leading-relaxed text-text-secondary">
              {hero.lede}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Body sections */}
      <section className="relative pb-20 lg:pb-28">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12">
            <article className="lg:col-span-8 lg:col-start-2">
              {sections.map((s, idx) => (
                <div key={s.id} id={s.id}>
                  <motion.div
                    initial={reduce ? false : "hidden"}
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  >
                    <div className="flex items-baseline gap-4 mb-4">
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.32em]"
                        style={{ color: a.hex }}
                      >
                        {s.number}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                        {s.label}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-text-primary mb-6 lg:mb-8">
                      {s.heading}
                    </h2>
                    <div className="editorial-prose">{s.body}</div>
                  </motion.div>
                  {idx < sections.length - 1 && (
                    <SectionBreak variant={s.break} accent={config.accent} />
                  )}
                </div>
              ))}

              {/* Process timeline */}
              <motion.div
                initial={reduce ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="mt-16 lg:mt-20"
              >
                <div className="flex items-baseline gap-4 mb-4">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.32em]"
                    style={{ color: a.hex }}
                  >
                    {String(sections.length + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    Process
                  </span>
                </div>
                <h2 className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-text-primary mb-4">
                  {process.heading}
                </h2>
                {process.lede && (
                  <p className="text-lg leading-relaxed text-text-secondary mb-10 lg:mb-12 max-w-2xl">
                    {process.lede}
                  </p>
                )}
                <ProcessTimeline steps={process.steps} accent={config.accent} />
              </motion.div>

              {/* Engagement scope */}
              <motion.div
                initial={reduce ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="mt-16 lg:mt-20"
              >
                <div className="flex items-baseline gap-4 mb-4">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.32em]"
                    style={{ color: a.hex }}
                  >
                    {String(sections.length + 2).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    Scope
                  </span>
                </div>
                <h2 className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-text-primary mb-6">
                  Timeline, deliverables, and pricing
                </h2>
                <EngagementScope
                  accent={config.accent}
                  timeline={scope.timeline}
                  pricing={scope.pricing}
                  deliverables={scope.deliverables}
                />
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={reduce ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="mt-16 lg:mt-20"
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.32em] mb-4"
                  style={{ color: a.hex }}
                >
                  Common questions
                </p>
                <h2 className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-text-primary mb-6">
                  What buyers usually ask before signing
                </h2>
                <Accordion
                  items={faq.map((f) => ({
                    question: f.question,
                    answer: f.answer,
                    category: "General" as const,
                  }))}
                />
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={reduce ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="mt-16 lg:mt-20"
              >
                <div
                  className="rounded-2xl p-8 lg:p-12 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${a.hex}10, transparent 70%)`,
                    border: `1px solid ${a.hex}22`,
                  }}
                >
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.32em] mb-4"
                    style={{ color: a.hex }}
                  >
                    {cta.eyebrow}
                  </p>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-text-primary mb-4 max-w-2xl">
                    {cta.heading}
                  </h2>
                  <p className="text-base lg:text-lg leading-relaxed text-text-secondary mb-7 max-w-2xl">
                    {cta.body}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={cta.primary.href}
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:translate-x-0.5"
                      style={{
                        backgroundColor: a.hex,
                        color: "#ffffff",
                      }}
                    >
                      {cta.primary.label}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    {cta.secondary && (
                      <Link
                        href={cta.secondary.href}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border transition-colors hover:bg-bg-secondary"
                        style={{
                          borderColor: `${a.hex}44`,
                          color: a.hex,
                        }}
                      >
                        {cta.secondary.label}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Sources */}
              {sources.length > 0 && <Sources sources={sources} />}

              {/* Author block */}
              <div className="mt-16 lg:mt-20 pt-8 border-t border-border-subtle text-sm text-text-muted">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] mb-2">
                  Author
                </p>
                <p className="leading-relaxed">
                  Joshua Jones is the principal architect of DBJ Technologies, a
                  solo digital engineering studio in Royse City, Texas, working
                  with service businesses across Dallas–Fort Worth. Last reviewed{" "}
                  {new Date(config.lastReviewed).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  .
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
