"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectDetail } from "@/lib/work-data";

interface ProjectDetailLayoutProps {
  project: ProjectDetail;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/**
 * Map the project's Tailwind gradient class to a single primary accent
 * hex used for tags, dividers, halos, and CTAs.
 */
function deriveAccent(gradient: string): string {
  const match = gradient.match(/from-([a-z]+)-(\d{3})/);
  if (!match) return "#3b82f6";
  const palette: Record<string, string> = {
    "violet-600": "#7c3aed",
    "violet-500": "#8b5cf6",
    "blue-600": "#2563eb",
    "blue-500": "#3b82f6",
    "cyan-500": "#06b6d4",
    "amber-600": "#d97706",
    "amber-500": "#f59e0b",
    "yellow-500": "#eab308",
    "pink-500": "#ec4899",
    "emerald-600": "#059669",
    "emerald-500": "#10b981",
  };
  return palette[`${match[1]}-${match[2]}`] ?? "#3b82f6";
}

/**
 * Map gradient to two halo colors used for the hero radial backdrop.
 */
function deriveHaloColors(gradient: string): [string, string] {
  const fromMatch = gradient.match(/from-([a-z]+-\d{3})/);
  const toMatch = gradient.match(/to-([a-z]+-\d{3})/);
  const palette: Record<string, string> = {
    "violet-600": "#7c3aed",
    "blue-600": "#2563eb",
    "cyan-500": "#06b6d4",
    "amber-600": "#d97706",
    "yellow-500": "#eab308",
    "pink-500": "#ec4899",
  };
  const a = palette[fromMatch?.[1] ?? ""] ?? "#3b82f6";
  const b = palette[toMatch?.[1] ?? ""] ?? "#06b6d4";
  return [a, b];
}

function resolveCtaButtonText(ctaHref: string): string {
  if (ctaHref === "/pathlight") return "Try Pathlight";
  return "Start a Project";
}

export function ProjectDetailLayout({ project }: ProjectDetailLayoutProps) {
  const reduced = useReducedMotion();
  const accent = deriveAccent(project.gradient);
  const [haloA, haloB] = deriveHaloColors(project.gradient);
  const ctaButtonText = resolveCtaButtonText(project.ctaHref);
  const sectionTotal = project.sections.length;

  // Variants
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
  const tag: Variants = {
    hidden: reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: EASE_OUT },
    },
  };
  const ruler: Variants = {
    hidden: reduced ? { scaleX: 1 } : { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: reduced ? 0 : 1.1, ease: EASE_OUT, delay: 0.1 },
    },
  };

  return (
    <article className="relative">
      {/* Hero - magazine cover spread */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        <div
          className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${haloA} 0%, transparent 65%)`,
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
                Back to All Work
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
                  Case Study
                </span>
                <span className="text-text-muted/50" aria-hidden="true">
                  /
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  {project.category}
                </span>
              </motion.div>

              {project.logoImage ? (
                <motion.div variants={item} className="mb-8">
                  <Image
                    src={project.logoImage}
                    alt={project.name}
                    width={800}
                    height={599}
                    priority
                    className="h-32 w-auto lg:h-40"
                  />
                  <span className="sr-only">{project.name}</span>
                </motion.div>
              ) : (
                <motion.h1
                  variants={item}
                  className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
                >
                  {project.name}
                </motion.h1>
              )}

              <motion.p
                variants={item}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-2xl mb-10"
              >
                {project.heroDescription}
              </motion.p>

              {/* Metrics inline strip */}
              <motion.div
                variants={item}
                className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:gap-x-10 mb-10"
              >
                {project.metrics.map((metric, i) => (
                  <div
                    key={metric.label}
                    className="flex items-baseline gap-2.5"
                  >
                    {i > 0 ? (
                      <div
                        className="hidden sm:block h-8 w-px bg-text-primary/15 -ml-3 mr-3"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className="font-display text-2xl lg:text-3xl font-bold leading-none"
                      style={{ color: accent }}
                    >
                      {metric.value}
                    </span>
                    <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      {metric.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                variants={item}
                className="flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target={project.liveUrl.startsWith("http") ? "_blank" : undefined}
                    rel={
                      project.liveUrl.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    View Live Site
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
                <Link
                  href="#case-study"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
                >
                  Read the Case Study
                </Link>
              </motion.div>
            </div>

            <motion.div variants={heroImage} className="relative mt-16 lg:mt-20">
              <motion.div
                variants={halo}
                className="absolute -inset-6 lg:-inset-10 -z-10 blur-3xl pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 30% 50%, ${haloA} 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, ${haloB} 0%, transparent 60%)`,
                }}
                aria-hidden="true"
              />
              <div
                className="relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 transform-gpu aspect-video bg-bg-secondary"
                style={{
                  borderColor: `${accent}55`,
                  boxShadow: `0 50px 120px -30px ${accent}55, 0 25px 60px -20px rgba(0,0,0,0.22)`,
                }}
              >
                {project.showcaseVideo ? (
                  /* When the project provides a showcase video, the video
                   * occupies the hero slot directly instead of stacking
                   * static image + video. The static `image` field is still
                   * used for /work grid cards, opengraph, and the poster. */
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={project.showcaseVideo.poster}
                    preload="metadata"
                  >
                    {project.showcaseVideo.webm ? (
                      <source src={project.showcaseVideo.webm} type="video/webm" />
                    ) : null}
                    <source src={project.showcaseVideo.mp4} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={project.image}
                    alt={`${project.name} screenshot`}
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 1400px"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section divider sits flush against the hero. */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent}33 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Notable callout - pull-quote feel */}
      {project.notable ? (
        <section className="relative pt-20 lg:pt-28">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
            <motion.figure
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: reduced ? 0 : 0.8, ease: EASE_OUT }}
              className="relative max-w-4xl mx-auto"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              />
              <blockquote className="pl-8 lg:pl-10 font-display text-[clamp(1.4rem,2.4vw,2rem)] font-medium leading-[1.35] tracking-tight text-text-primary">
                {project.notable}
              </blockquote>
            </motion.figure>
          </div>
        </section>
      ) : null}

      {/* Narrative sections */}
      <section
        id="case-study"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          {project.sections.map((section, i) => (
            <motion.article
              key={section.heading}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="mb-20 lg:mb-28 last:mb-0"
            >
              <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
                <motion.div
                  variants={tag}
                  className="flex items-center gap-2.5 shrink-0"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                    Chapter
                  </span>
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted/60">
                    / {String(sectionTotal).padStart(2, "0")}
                  </span>
                </motion.div>
                <motion.span
                  variants={ruler}
                  className="h-[2px] flex-1 origin-left"
                  style={{
                    background: `linear-gradient(90deg, ${accent} 0%, ${accent}11 100%)`,
                  }}
                  aria-hidden="true"
                />
              </div>

              <motion.h2
                variants={item}
                className="font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-bold leading-[1.1] tracking-tight mb-8 lg:mb-10 max-w-4xl"
              >
                {section.heading}
              </motion.h2>

              <motion.div variants={item} className="mx-auto max-w-3xl">
                <p className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary whitespace-pre-line">
                  {section.body}
                </p>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Tech deep dive */}
      <section className="relative py-20 lg:py-28 bg-bg-secondary/50 border-t border-text-primary/8">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger}
            className="max-w-4xl mb-12 lg:mb-16"
          >
            <motion.div
              variants={item}
              className="flex items-center gap-3 mb-5"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Built With
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                And Why
              </span>
            </motion.div>
            <motion.h2
              variants={item}
              className="font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-bold leading-[1.12] tracking-tight"
            >
              The technical decisions behind this build.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: reduced
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.08 },
              },
            }}
            className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {project.techDetails.map((tech) => (
              <motion.div
                key={tech.name}
                variants={{
                  hidden: reduced
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: reduced ? 0 : 0.6, ease: EASE_OUT },
                  },
                }}
                whileHover={
                  reduced
                    ? undefined
                    : { y: -8, transition: { duration: 0.35, ease: EASE_OUT } }
                }
                className="group relative rounded-xl border p-6 lg:p-7 overflow-hidden cursor-default"
                style={{
                  borderColor: `${accent}30`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${accent}07 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 12px 32px -12px ${accent}28`,
                    `0 32px 64px -32px ${accent}18`,
                  ].join(", "),
                }}
              >
                <span
                  className="absolute -inset-px rounded-xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                  style={{
                    boxShadow: [
                      `0 28px 64px -16px ${accent}55`,
                      `0 64px 128px -32px ${accent}30`,
                      `0 0 0 1px ${accent}30`,
                    ].join(", "),
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-5 right-5 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${accent}99 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-5 right-5 h-px pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <h3
                  className="font-display text-lg font-bold mb-2.5 transition-transform duration-300"
                  style={{ color: accent }}
                >
                  {tech.name}
                </h3>
                <p className="text-sm text-text-secondary leading-[1.7]">
                  {tech.reason}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline pull-quote */}
      {project.timeline ? (
        <section className="relative py-20 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
            <motion.figure
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: reduced ? 0 : 0.8, ease: EASE_OUT }}
              className="relative max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Timeline
                </span>
              </div>
              <p className="font-display text-[clamp(1.3rem,2.2vw,1.85rem)] font-medium leading-[1.4] tracking-tight text-text-primary">
                {project.timeline}
              </p>
            </motion.figure>
          </div>
        </section>
      ) : null}

      {/* Closing CTA */}
      <section className="relative py-20 lg:py-28 border-t border-text-primary/10 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger}
            className="max-w-4xl"
          >
            <motion.p
              variants={item}
              className="font-mono text-[11px] uppercase tracking-[0.22em] mb-5"
              style={{ color: accent }}
            >
              Build It For Real
            </motion.p>
            <motion.h3
              variants={item}
              className="font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-[1.1] tracking-tight mb-8"
            >
              {project.ctaText}
            </motion.h3>
            <motion.div variants={item}>
              <Link
                href={project.ctaHref}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: accent }}
              >
                {ctaButtonText}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </article>
  );
}
