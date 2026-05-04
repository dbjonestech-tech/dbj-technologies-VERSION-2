"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CTASection } from "@/components/sections/CTA";
import { PROJECT_DETAILS } from "@/lib/work-data";
import type { DesignBriefMeta } from "@/lib/design-briefs";

interface WorkContentProps {
  designBriefs: DesignBriefMeta[];
}

/* ─── PAGE IDENTITY ───────────────────────────────────
   Work is the forest brown page. Deep walnut/oak tones
   carry structural elements. Brand-blue stays as the
   primary CTA color. The feeling is craft - a deeply
   built portfolio with the warmth of finished wood
   rather than the cool of polished metal. */
const PAGE_ACCENT = "#5d4037"; // deep walnut
const PAGE_LIGHT = "#8d6e63"; // warm tan
const PAGE_DARK = "#3e2723"; // espresso / deep oak
const PAGE_HIGHLIGHT = "#bcaaa4"; // pale warm beige
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

export default function WorkContent({ designBriefs }: WorkContentProps) {
  const reduce = useReducedMotion();

  const heroStagger: Variants = {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const heroItem: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `radial-gradient(ellipse 60% 45% at 50% 10%, ${PAGE_LIGHT} 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 20%, ${PAGE_ACCENT} 0%, transparent 55%)`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroStagger}
          >
            <motion.span
              variants={heroItem}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{
                borderColor: `${PAGE_ACCENT}33`,
                backgroundColor: `${PAGE_ACCENT}0a`,
                color: PAGE_DARK,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PAGE_ACCENT }}
                aria-hidden="true"
              />
              Portfolio
            </motion.span>
            <motion.h1
              variants={heroItem}
              className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight"
            >
              Selected
              <br />
              <span style={{ color: PAGE_DARK }}>Builds.</span>
            </motion.h1>
            <motion.p
              variants={heroItem}
              className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-[1.6]"
            >
              Each project below is running in production right now, with
              metrics from real users.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── PROJECTS ─────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {PROJECT_DETAILS.map((project, i) => (
              <motion.article
                key={project.slug}
                initial={
                  reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{
                  duration: reduce ? 0 : 0.7,
                  ease: EASE_OUT,
                  delay: reduce ? 0 : i * 0.08,
                }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -6, transition: { duration: 0.35, ease: EASE_OUT } }
                }
                className="group relative flex flex-col rounded-2xl border bg-bg-primary"
                style={{
                  borderColor: `${PAGE_ACCENT}28`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}07 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    `0 14px 36px -14px ${PAGE_ACCENT}28`,
                  ].join(", "),
                }}
              >
                {/* Hover halo */}
                <span
                  className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                  style={{
                    boxShadow: [
                      `0 28px 64px -16px ${PAGE_ACCENT}50`,
                      `0 64px 128px -32px ${PAGE_ACCENT}28`,
                      `0 0 0 1px ${PAGE_ACCENT}38`,
                    ].join(", "),
                  }}
                  aria-hidden="true"
                />
                {/* Top edge highlight */}
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}99 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_HIGHLIGHT} 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Screenshot or autoplay showcase loop */}
                <div className="relative aspect-[3/2] overflow-hidden rounded-t-2xl bg-bg-secondary">
                  {project.showcaseVideo ? (
                    <video
                      className="h-full w-full object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={project.showcaseVideo.poster}
                      preload="metadata"
                      aria-label={`${project.name} showcase`}
                    >
                      {project.showcaseVideo.webm ? (
                        <source
                          src={project.showcaseVideo.webm}
                          type="video/webm"
                        />
                      ) : null}
                      <source
                        src={project.showcaseVideo.mp4}
                        type="video/mp4"
                      />
                    </video>
                  ) : (
                    <Image
                      src={project.image}
                      alt={`${project.name} screenshot`}
                      fill
                      className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <span
                    className="inline-flex items-center self-start gap-2 rounded-full border px-3 py-1 mb-4 font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      borderColor: `${PAGE_ACCENT}40`,
                      backgroundColor: `${PAGE_ACCENT}0a`,
                      color: PAGE_DARK,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: PAGE_ACCENT }}
                      aria-hidden="true"
                    />
                    {project.category}
                  </span>
                  <h2 className="font-display text-2xl font-bold mb-3 tracking-tight">
                    {project.name}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                    {project.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="min-w-0 rounded-xl border px-3 py-4 text-center"
                        style={{
                          borderColor: `${PAGE_ACCENT}1f`,
                          background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}06 100%)`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95)`,
                        }}
                      >
                        <p
                          className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                          style={{ color: PAGE_DARK }}
                        >
                          {m.label}
                        </p>
                        <p
                          className="font-display text-2xl font-bold leading-tight break-words tabular-nums"
                          style={{ color: PAGE_DARK }}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: `${PAGE_ACCENT}22`,
                          backgroundColor: "white",
                          color: "#52443c",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Notable callout */}
                  <div
                    className="rounded-xl border p-4 mb-8"
                    style={{
                      borderColor: `${PAGE_ACCENT}22`,
                      background: `linear-gradient(180deg, ${PAGE_LIGHT}08 0%, ${PAGE_ACCENT}05 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.85)`,
                    }}
                  >
                    <p
                      className="text-[10px] font-mono uppercase tracking-widest mb-2"
                      style={{ color: PAGE_DARK }}
                    >
                      Notable
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {project.notable}
                    </p>
                  </div>

                  {/* Two links */}
                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                    <Link
                      href={`/work/${project.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3 min-h-[44px]"
                      style={{ color: PAGE_DARK }}
                    >
                      View Case Study
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">: {project.name}</span>
                    </Link>
                    {project.liveUrl ? (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors min-h-[44px]"
                      >
                        Live Site
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESIGN BRIEFS ────────────────────────────── */}
      <section
        className="relative py-24 border-t overflow-hidden"
        style={{ borderColor: `${PAGE_ACCENT}1a` }}
      >
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              background: `radial-gradient(ellipse 50% 40% at 20% 20%, ${PAGE_LIGHT} 0%, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <motion.span
              initial={
                reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{
                duration: reduce ? 0 : 0.6,
                ease: EASE_OUT,
              }}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{
                borderColor: `${PAGE_ACCENT}33`,
                backgroundColor: `${PAGE_ACCENT}0a`,
                color: PAGE_DARK,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PAGE_ACCENT }}
                aria-hidden="true"
              />
              Design Briefs
            </motion.span>
            <motion.h2
              initial={
                reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.1,
              }}
              className="mt-6 font-display text-[clamp(2rem,3.6vw,2.8rem)] font-bold leading-tight tracking-tight"
            >
              Reference{" "}
              <span style={{ color: PAGE_DARK }}>architectures.</span>
            </motion.h2>
            <motion.p
              initial={
                reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.15,
              }}
              className="mt-5 text-text-secondary leading-relaxed"
            >
              Design briefs covering a selection of verticals I work in. Each
              one digs into what the category actually needs online: how the
              customer chooses, what most sites get wrong, and the surfaces
              that turn a search into a booking.
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {designBriefs.map((brief, i) => (
              <motion.article
                key={brief.slug}
                initial={
                  reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{
                  duration: reduce ? 0 : 0.6,
                  ease: EASE_OUT,
                  delay: reduce ? 0 : i * 0.05,
                }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -6, transition: { duration: 0.35, ease: EASE_OUT } }
                }
                className="group relative flex flex-col rounded-2xl border bg-bg-primary"
                style={{
                  borderColor: `${brief.paletteAccent}28`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${brief.paletteAccent}06 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    `0 14px 36px -14px ${brief.paletteAccent}28`,
                  ].join(", "),
                }}
              >
                <span
                  className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                  style={{
                    boxShadow: [
                      `0 28px 64px -16px ${brief.paletteAccent}55`,
                      `0 64px 128px -32px ${brief.paletteAccent}28`,
                      `0 0 0 1px ${brief.paletteAccent}40`,
                    ].join(", "),
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${brief.paletteAccent}99 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Preview */}
                <div className="relative aspect-[3/2] overflow-hidden rounded-t-2xl">
                  <Image
                    src={brief.preview}
                    alt={`${brief.vertical} reference architecture preview`}
                    fill
                    className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                  />
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <span
                    className="inline-flex items-center self-start gap-2 rounded-full border px-3 py-1 mb-4 font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      borderColor: `${brief.paletteAccent}40`,
                      backgroundColor: `${brief.paletteAccent}0a`,
                      color: brief.paletteAccent,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: brief.paletteAccent }}
                      aria-hidden="true"
                    />
                    {brief.vertical}
                  </span>

                  <h3 className="font-display text-2xl font-bold mb-3 leading-tight tracking-tight">
                    {brief.headline}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    {brief.description}
                  </p>

                  {/* Key surfaces */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                    {brief.keySurfaces.map((surface) => (
                      <div
                        key={surface}
                        className="min-w-0 rounded-xl border px-3 py-4 text-center"
                        style={{
                          borderColor: `${brief.paletteAccent}1f`,
                          background: `linear-gradient(180deg, #ffffff 0%, ${brief.paletteAccent}06 100%)`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95)`,
                        }}
                      >
                        <p
                          className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
                          style={{ color: brief.paletteAccent }}
                        >
                          Surface
                        </p>
                        <p className="font-display text-[13px] font-bold text-text-primary leading-tight break-words">
                          {surface}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Brief callout */}
                  <div
                    className="rounded-xl border p-4 mb-8"
                    style={{
                      borderColor: `${brief.paletteAccent}22`,
                      background: `linear-gradient(180deg, ${brief.paletteAccent}08 0%, ${brief.paletteAccent}03 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.85)`,
                    }}
                  >
                    <p
                      className="text-[10px] font-mono uppercase tracking-widest mb-2"
                      style={{ color: brief.paletteAccent }}
                    >
                      In the Brief
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {brief.summary}
                    </p>
                  </div>

                  {/* Single CTA */}
                  <div className="mt-auto flex items-center gap-6 pt-2">
                    <Link
                      href={`/work/design-briefs/${brief.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3 min-h-[44px]"
                      style={{ color: brief.paletteAccent }}
                    >
                      Read the Design Brief
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">: {brief.vertical}</span>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        heading="Let's Build"
        highlight="Yours."
        description="Tell me about your project and I'll show you what's possible."
        buttonText="Start a Project"
        buttonHref="/contact"
      />
    </>
  );
}
