"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { SERVICES } from "@/lib/constants";

/* ─── PAGE IDENTITY ───────────────────────────────────
   Services is the emerald page. Emerald-600 carries
   structural elements (chapter rulers, dots, tags, layer
   bars). Emerald-300/400 carry luminous halos and pulses.
   Emerald-800 carries depth in gradients. Brand-blue
   stays as the primary CTA color. Emerald reads as
   "build / grow / engineering," distinct from the cyan
   of Process and the pure brand-blue of About. */
const PAGE_ACCENT = "#059669"; // emerald-600
const PAGE_LIGHT = "#34d399"; // emerald-400
const PAGE_DARK = "#065f46"; // emerald-800
const PAGE_HIGHLIGHT = "#6ee7b7"; // emerald-300, peak glow
const BRAND_BLUE = "#3b82f6";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/* ─── PULSING DOT ─────────────────────────────────────
   Same breathing accent dot used on Process. Cycles
   opacity, scale, and a soft glow boxShadow on a 3.6s
   loop. Gated through useReducedMotion. */
function PulsingDot({
  delay = 0,
  size = 8,
  color = PAGE_ACCENT,
  reduce,
}: {
  delay?: number;
  size?: number;
  color?: string;
  reduce: boolean | null;
}) {
  return (
    <motion.span
      className="inline-block rounded-full shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        boxShadow: `0 0 0 0 ${color}66`,
      }}
      animate={
        reduce
          ? undefined
          : {
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.18, 1],
              boxShadow: [
                `0 0 0 0 ${color}66`,
                `0 0 12px 3px ${color}66`,
                `0 0 0 0 ${color}66`,
              ],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              duration: 3.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }
      }
      aria-hidden="true"
    />
  );
}

/* ─── CHAPTER HEADER ──────────────────────────────────
   Mono-caps tag + animated ruler + heading. Same
   pattern as Process / Brief / Case Study so the entire
   site reads as one editorial document. */
function ChapterHeader({
  label,
  heading,
  position,
  total,
  reduce,
}: {
  label: string;
  heading: string;
  position?: number;
  total?: number;
  reduce: boolean | null;
}) {
  const tagV: Variants = {
    hidden: reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: EASE_OUT },
    },
  };
  const rulerV: Variants = {
    hidden: reduce ? { scaleX: 1 } : { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: reduce ? 0 : 1.1,
        ease: EASE_OUT,
        delay: 0.1,
      },
    },
  };
  const headingV: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0 : 0.7,
        ease: EASE_OUT,
        delay: 0.15,
      },
    },
  };

  const dotDelay =
    position !== undefined
      ? (position - 1) * 0.5
      : (label.charCodeAt(0) % 5) * 0.4;

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-10">
        <motion.div variants={tagV} className="flex items-center gap-2.5 shrink-0">
          <PulsingDot delay={dotDelay} reduce={reduce} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
            {label}
          </span>
          {position !== undefined && total !== undefined ? (
            <>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: PAGE_ACCENT }}
              >
                {String(position).padStart(2, "0")}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted/60">
                / {String(total).padStart(2, "0")}
              </span>
            </>
          ) : null}
        </motion.div>
        <motion.span
          variants={rulerV}
          className="h-[2px] flex-1 origin-left"
          style={{
            background: `linear-gradient(90deg, ${PAGE_LIGHT} 0%, ${PAGE_ACCENT} 35%, ${PAGE_ACCENT}11 100%)`,
            boxShadow: `0 0 14px ${PAGE_LIGHT}33`,
          }}
          aria-hidden="true"
        />
      </div>
      <motion.h2
        variants={headingV}
        className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-[1.1] tracking-tight max-w-4xl"
      >
        {heading}
      </motion.h2>
    </motion.div>
  );
}

/* ─── CAPABILITY STACK (HERO SIGNATURE) ───────────────
   Vertical stack of architectural disciplines. Each
   layer is a horizontal row showing the icon on the
   left, the discipline name and a short tagline on the
   right, with a slim accent bar at the leading edge.
   Layers stagger in from the right on mount, top to
   bottom, like a system being assembled. The page's
   signature element. */
function CapabilityStack({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="space-y-3 relative">
      {SERVICES.map((service, i) => {
        const Icon = service.icon;
        return (
          <motion.div
            key={service.slug}
            initial={
              reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduce ? 0 : 0.7,
              ease: EASE_OUT,
              delay: reduce ? 0 : 0.4 + i * 0.12,
            }}
            className="group relative flex items-start lg:items-center gap-3 sm:gap-4 rounded-xl border p-3.5 sm:p-4 transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:translate-x-1"
            style={{
              borderColor: `${PAGE_ACCENT}30`,
              background: `linear-gradient(135deg, #ffffff 0%, ${PAGE_LIGHT}08 100%)`,
              boxShadow: [
                "inset 0 1px 0 rgba(255,255,255,0.95)",
                "0 1px 2px rgba(0,0,0,0.03)",
                `0 6px 16px -8px ${PAGE_ACCENT}22`,
              ].join(", "),
            }}
          >
            {/* Leading accent bar */}
            <span
              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
              style={{
                background: `linear-gradient(180deg, ${PAGE_LIGHT} 0%, ${PAGE_ACCENT} 100%)`,
                boxShadow: `0 0 6px ${PAGE_LIGHT}55`,
              }}
              aria-hidden="true"
            />
            {/* Brushed-metal icon chip */}
            <div
              className="ml-1.5 sm:ml-2 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0 transition-transform duration-300 motion-safe:group-hover:scale-110"
              style={{
                background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}12 100%)`,
                color: PAGE_ACCENT,
                boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
              }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm lg:text-base font-bold text-text-primary leading-tight tracking-tight">
                {service.title}
              </h3>
              <p className="mt-0.5 text-xs lg:text-[0.8rem] text-text-secondary leading-snug line-clamp-2 lg:truncate">
                {service.tagline}
              </p>
            </div>
            <span
              className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.2em] shrink-0"
              style={{ color: PAGE_ACCENT }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ServicesContent() {
  const reduce = useReducedMotion();

  const heroStagger: Variants = {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const heroItem: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <>
      {/* ─── HERO: CAPABILITY STACK ───────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        {/* Page-identity wash */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{
              background: `radial-gradient(ellipse 60% 45% at 85% 20%, ${PAGE_LIGHT} 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 15% 30%, ${PAGE_ACCENT} 0%, transparent 55%)`,
            }}
          />
        </div>

        {/* Diagonal architectural overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(45deg, ${PAGE_ACCENT} 1px, transparent 1px), linear-gradient(-45deg, ${PAGE_ACCENT} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 xl:gap-20 items-start">
            {/* LEFT: title block */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroStagger}
              className="lg:pt-4"
            >
              <motion.div
                variants={heroItem}
                className="flex items-center gap-3 mb-7 flex-wrap"
              >
                <PulsingDot reduce={reduce} />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Capabilities
                </span>
                <span className="text-text-muted/50" aria-hidden="true">
                  /
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: PAGE_ACCENT }}
                >
                  6 Disciplines
                </span>
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
              >
                What I Engineer.
                <br />
                <span style={{ color: PAGE_ACCENT }}>And How.</span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-xl mb-10"
              >
                From frontend architecture to cloud infrastructure, every
                discipline is scoped, priced, and delivered to the same
                production grade standard.
              </motion.p>

              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-3 mb-10"
              >
                <div className="flex items-baseline gap-2 sm:gap-2.5">
                  <span
                    className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    6
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Disciplines
                  </span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-text-primary/15" aria-hidden="true" />
                <div className="flex items-baseline gap-2 sm:gap-2.5">
                  <span
                    className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    1
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Standard
                  </span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-text-primary/15" aria-hidden="true" />
                <div className="flex items-baseline gap-2 sm:gap-2.5">
                  <span
                    className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    0
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Templates
                  </span>
                </div>
              </motion.div>

              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Discuss a Project
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#disciplines"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
                >
                  See Each Discipline
                </Link>
              </motion.div>
            </motion.div>

            {/* RIGHT: Capability Stack signature */}
            <div className="relative">
              {/* Outer breathing halo. Two stacked halos with offset
                  timings so the stack appears lit from beneath, like
                  a stack of architectural drawings on a light table. */}
              {!reduce ? (
                <>
                  <motion.div
                    className="absolute -inset-8 lg:-inset-12 -z-10 blur-3xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${PAGE_LIGHT} 0%, transparent 70%)`,
                    }}
                    animate={{ opacity: [0.16, 0.32, 0.16] }}
                    transition={{
                      duration: 5.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                    aria-hidden="true"
                  />
                  <motion.div
                    className="absolute -inset-6 lg:-inset-10 -z-10 blur-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 60% 40%, ${PAGE_ACCENT} 0%, transparent 60%)`,
                    }}
                    animate={{ opacity: [0.10, 0.22, 0.10] }}
                    transition={{
                      duration: 6.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.6,
                    }}
                    aria-hidden="true"
                  />
                </>
              ) : (
                <div
                  className="absolute -inset-8 lg:-inset-12 -z-10 blur-3xl pointer-events-none opacity-25"
                  style={{
                    background: `radial-gradient(ellipse at center, ${PAGE_LIGHT} 0%, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />
              )}
              <div
                className="relative rounded-2xl lg:rounded-3xl border p-4 sm:p-6 lg:p-8 transform-gpu overflow-hidden"
                style={{
                  borderColor: `${PAGE_ACCENT}40`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}0d 60%, ${PAGE_ACCENT}0a 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "inset 0 0 0 1px rgba(255,255,255,0.4)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 18px 48px -16px ${PAGE_ACCENT}40`,
                    `0 48px 100px -32px ${PAGE_ACCENT}30`,
                    `0 80px 140px -40px ${PAGE_DARK}25`,
                  ].join(", "),
                }}
              >
                {/* Top edge highlight: gradient with cyan-300 peak */}
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}aa 35%, ${PAGE_HIGHLIGHT}cc 50%, ${PAGE_LIGHT}aa 65%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2.5 mb-5 lg:mb-6">
                  <PulsingDot reduce={reduce} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    The Stack
                  </span>
                </div>
                <CapabilityStack reduce={reduce} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${PAGE_ACCENT}33 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ─── DISCIPLINE DEEP-DIVES ───────────────────── */}
      <section
        id="disciplines"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-20 lg:mb-28 max-w-3xl">
            <ChapterHeader
              label="Six Disciplines"
              heading="Every Layer of the System."
              reduce={reduce}
            />
            <motion.p
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.25,
              }}
              className="mt-8 text-lg leading-[1.7] text-text-secondary"
            >
              Each discipline is its own scoped engagement. Take one, take a
              few, or take the whole stack. Every layer is built to the same
              production grade standard.
            </motion.p>
          </div>

          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.article
                key={service.slug}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                className="mb-24 lg:mb-32 last:mb-0"
              >
                <ChapterHeader
                  label="Discipline"
                  heading={service.title}
                  position={i + 1}
                  total={SERVICES.length}
                  reduce={reduce}
                />

                <div className="mt-12 lg:mt-16 grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16">
                  {/* Left: discipline description */}
                  <motion.div
                    initial={
                      reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{
                      duration: reduce ? 0 : 0.7,
                      ease: EASE_OUT,
                      delay: 0.25,
                    }}
                  >
                    <div
                      className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(145deg, ${PAGE_LIGHT}25 0%, ${PAGE_ACCENT}12 100%)`,
                        color: PAGE_ACCENT,
                        boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}55, 0 0 0 1px ${PAGE_ACCENT}22`,
                      }}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary">
                      {service.description}
                    </p>
                    <Link
                      href="/contact"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                      style={{ color: PAGE_ACCENT }}
                    >
                      Discuss this discipline
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </motion.div>

                  {/* Right: features list */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={VIEWPORT}
                    variants={{
                      hidden: {},
                      visible: {
                        transition: reduce
                          ? { staggerChildren: 0 }
                          : { staggerChildren: 0.06, delayChildren: 0.4 },
                      },
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <PulsingDot reduce={reduce} delay={i * 0.5 + 0.3} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                        What's Included
                      </span>
                    </div>
                    <ul className="space-y-4">
                      {service.features.map((feature) => (
                        <motion.li
                          key={feature}
                          variants={{
                            hidden: reduce
                              ? { opacity: 1, x: 0 }
                              : { opacity: 0, x: -12 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              transition: {
                                duration: reduce ? 0 : 0.5,
                                ease: EASE_OUT,
                              },
                            },
                          }}
                          className="flex items-start gap-3 text-[0.95rem] lg:text-base text-text-secondary leading-[1.6]"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-[18px] w-[18px] flex-shrink-0"
                            style={{ color: PAGE_ACCENT }}
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ─── CLOSING CTA ──────────────────────────────── */}
      <section className="relative py-24 lg:py-32 border-t border-text-primary/10 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: reduce
                  ? { staggerChildren: 0, delayChildren: 0 }
                  : { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
            className="max-w-4xl"
          >
            <motion.div
              variants={heroItem}
              className="flex items-center gap-2.5 mb-5"
            >
              <PulsingDot reduce={reduce} delay={1.4} />
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: PAGE_ACCENT }}
              >
                Need Something Specific
              </span>
            </motion.div>
            <motion.h3
              variants={heroItem}
              className="font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-[1.1] tracking-tight mb-6"
            >
              Let's Scope It.
            </motion.h3>
            <motion.p
              variants={heroItem}
              className="text-text-secondary leading-relaxed mb-8 lg:text-lg max-w-2xl"
            >
              Every engagement starts with a clear scope and fixed price. Tell
              me what you need and I will define exactly what it takes.
            </motion.p>
            <motion.div variants={heroItem}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Start a Conversation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
