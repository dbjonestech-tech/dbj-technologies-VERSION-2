"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import {
  PRICING_TIERS,
  PRICING_ADDONS,
  FAQ_ITEMS,
} from "@/lib/constants";

/* ─── PAGE IDENTITY ───────────────────────────────────
   Pricing is the bronze/amber page. Amber-700 carries
   structural elements (chapter rulers, dots, ledger
   numerals, tier card accents). Amber-400/500 carry
   luminous halos. Amber-900 carries depth. Brand-blue
   stays as primary CTA color. Amber reads as "value /
   premium / brass fittings," distinct from the cyan of
   Process, the emerald of Services, and the brand-blue
   of About. The fee ledger feel is intentional, like a
   beautifully typeset invoice on warm paper. */
const PAGE_ACCENT = "#b45309"; // amber-700
const PAGE_LIGHT = "#f59e0b"; // amber-500
const PAGE_DARK = "#78350f"; // amber-900
const PAGE_HIGHLIGHT = "#fbbf24"; // amber-400, peak glow
const BRAND_BLUE = "#3b82f6";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/* ─── PULSING DOT ───────────────────────────────────── */
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

/* ─── CHAPTER HEADER ─────────────────────────────────── */
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

export default function PricingContent() {
  const reduce = useReducedMotion();
  const billingFaqs = FAQ_ITEMS.filter((f) => f.category === "Billing");

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
      {/* ─── HERO: FEE LEDGER ─────────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        {/* Page-identity wash: warm amber radials */}
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

        {/* Ledger-style horizontal rule pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${PAGE_ACCENT} 0px, ${PAGE_ACCENT} 1px, transparent 1px, transparent 32px)`,
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroStagger}
          >
            <motion.div
              variants={heroItem}
              className="inline-flex items-center gap-3 mb-7 flex-wrap justify-center"
            >
              <PulsingDot reduce={reduce} />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Engagement Tiers
              </span>
              <span className="text-text-muted/50" aria-hidden="true">
                /
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: PAGE_ACCENT }}
              >
                Fixed Price
              </span>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
            >
              Fixed Pricing.
              <br />
              <span style={{ color: PAGE_ACCENT }}>Clear Scope.</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-xl mx-auto mb-10"
            >
              Every project starts with a clear scope and a fixed price. Know
              exactly what you are getting, and what it costs, before I write
              a single line of code.
            </motion.p>

            <motion.div
              variants={heroItem}
              className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-3 mb-10"
            >
              <div className="flex items-baseline gap-2 sm:gap-2.5">
                <span
                  className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-none"
                  style={{ color: PAGE_ACCENT }}
                >
                  3
                </span>
                <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                  Tiers
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
                  Hourly
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
                  Invoice
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            >
              <Link
                href="/pricing/build"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Build a Custom Package
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#tiers"
                className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
              >
                See Each Tier
              </Link>
            </motion.div>
          </motion.div>
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

      {/* ─── TIER DEEP-DIVES ──────────────────────────── */}
      <section
        id="tiers"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-20 lg:mb-28 max-w-3xl">
            <ChapterHeader
              label="Three Tiers"
              heading="Pick the One That Fits."
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
              Three engagement sizes for three kinds of business. Every tier
              ships with full source code, no platform fees, no hourly
              billing.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: reduce
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.12, delayChildren: 0.2 },
              },
            }}
            className="grid gap-8 lg:grid-cols-3 items-start"
          >
            {PRICING_TIERS.map((tier) => (
              <motion.div
                key={tier.name}
                variants={{
                  hidden: reduce
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: reduce ? 0 : 0.7,
                      ease: EASE_OUT,
                    },
                  },
                }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -8, transition: { duration: 0.35, ease: EASE_OUT } }
                }
                className={`group relative rounded-2xl border p-8 cursor-default ${
                  tier.popular ? "lg:-mt-4 lg:mb-4" : ""
                }`}
                style={{
                  borderColor: tier.popular
                    ? `${PAGE_ACCENT}55`
                    : `${PAGE_ACCENT}25`,
                  background: tier.popular
                    ? `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}10 100%)`
                    : `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}05 100%)`,
                  boxShadow: tier.popular
                    ? [
                        "inset 0 1px 0 rgba(255,255,255,0.95)",
                        "0 1px 2px rgba(0,0,0,0.04)",
                        `0 18px 48px -16px ${PAGE_ACCENT}40`,
                        `0 48px 100px -32px ${PAGE_ACCENT}28`,
                      ].join(", ")
                    : [
                        "inset 0 1px 0 rgba(255,255,255,0.95)",
                        "0 1px 2px rgba(0,0,0,0.04)",
                        `0 12px 32px -12px ${PAGE_ACCENT}25`,
                        `0 32px 64px -32px ${PAGE_ACCENT}15`,
                      ].join(", "),
                }}
              >
                {/* Hover halo */}
                <span
                  className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                  style={{
                    boxShadow: [
                      `0 30px 70px -16px ${PAGE_ACCENT}55`,
                      `0 70px 140px -32px ${PAGE_ACCENT}30`,
                      `0 0 0 1px ${PAGE_ACCENT}40`,
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

                {tier.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                      style={{
                        backgroundColor: PAGE_ACCENT,
                        boxShadow: `0 6px 18px -6px ${PAGE_ACCENT}aa`,
                      }}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Most Popular
                    </span>
                  </div>
                ) : null}

                <h3 className="font-display text-2xl font-bold tracking-tight">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {tier.description}
                </p>

                <div className="mt-6 mb-8">
                  {tier.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-display text-5xl font-bold tabular-nums"
                        style={{ color: PAGE_DARK }}
                      >
                        ${tier.price.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div
                        className="font-display text-4xl font-bold"
                        style={{ color: PAGE_DARK }}
                      >
                        Custom
                      </div>
                      <div className="text-text-muted text-sm mt-1">
                        Starts at $15,000
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-text-secondary mt-2">
                    Delivered in {tier.timeline}
                  </p>
                </div>

                <Link
                  href={`/pricing/${tier.name.toLowerCase()}`}
                  className="block w-full text-center rounded-xl py-3.5 font-semibold text-sm transition-all"
                  style={
                    tier.popular
                      ? {
                          backgroundColor: BRAND_BLUE,
                          color: "white",
                          boxShadow: `0 8px 20px -8px ${BRAND_BLUE}aa`,
                        }
                      : {
                          border: `1px solid ${PAGE_ACCENT}33`,
                          color: PAGE_DARK,
                          background: "white",
                        }
                  }
                >
                  {tier.cta}
                </Link>

                <div
                  className="mt-8 pt-8 space-y-3 border-t"
                  style={{ borderColor: `${PAGE_ACCENT}1a` }}
                >
                  {tier.features.map((f) => (
                    <div key={f.text} className="flex items-center gap-3">
                      {f.included ? (
                        <Check
                          className="h-4 w-4 shrink-0"
                          style={{ color: PAGE_ACCENT }}
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-4 w-4 shrink-0 text-text-muted/40"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`text-sm ${
                          f.included
                            ? "text-text-secondary"
                            : "text-text-muted/40"
                        }`}
                      >
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Canopy Specialty Engagement section pulled 2026-04-30. The first
       * install (Star Auto Service) shipped April 29 but Canopy is not yet
       * ready to be sold publicly: 1 install, no proven case studies across
       * verticals, no testimonials, ICP still being validated. Lives on
       * /work/canopy as proof-of-craft until the playbook proves out. The
       * full markup is preserved in git history for restoration. */}

      {/* ─── ADD-ONS ──────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 border-t border-text-primary/8">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-16 lg:mb-20 max-w-3xl">
            <ChapterHeader
              label="Add-Ons"
              heading="Flexible Engagements."
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
              Smaller scoped engagements for projects that don't need a full
              tier. Same fixed-price guarantee.
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: reduce
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            className="grid gap-6 md:grid-cols-2 max-w-4xl"
          >
            {PRICING_ADDONS.map((addon) => (
              <motion.div
                key={addon.name}
                variants={{
                  hidden: reduce
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: reduce ? 0 : 0.7,
                      ease: EASE_OUT,
                    },
                  },
                }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -6, transition: { duration: 0.35, ease: EASE_OUT } }
                }
                className="group relative rounded-2xl border p-7 lg:p-8 overflow-hidden cursor-default"
                style={{
                  borderColor: `${PAGE_ACCENT}26`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}06 100%)`,
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.95)",
                    "0 1px 2px rgba(0,0,0,0.04)",
                    `0 10px 28px -12px ${PAGE_ACCENT}22`,
                    `0 28px 56px -28px ${PAGE_ACCENT}12`,
                  ].join(", "),
                }}
              >
                <span
                  className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                  style={{
                    boxShadow: [
                      `0 24px 56px -16px ${PAGE_ACCENT}44`,
                      `0 56px 120px -32px ${PAGE_ACCENT}25`,
                    ].join(", "),
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${PAGE_LIGHT}88 50%, transparent 100%)`,
                  }}
                  aria-hidden="true"
                />
                <h3 className="font-display text-xl font-bold tracking-tight">
                  {addon.name}
                </h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {addon.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className="font-display text-3xl font-bold tabular-nums"
                    style={{ color: PAGE_DARK }}
                  >
                    ${addon.price}
                  </span>
                  <span className="text-sm text-text-muted">
                    / {addon.unit.replace("per ", "")}
                  </span>
                </div>
                <Link
                  href={addon.href}
                  className="mt-6 block w-full text-center rounded-xl py-3.5 font-semibold text-sm transition-all"
                  style={{
                    border: `1px solid ${PAGE_ACCENT}33`,
                    color: PAGE_DARK,
                    background: "white",
                  }}
                >
                  {addon.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── BILLING FAQ ──────────────────────────────── */}
      <section className="relative py-24 lg:py-32 border-t border-text-primary/8 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-16 lg:mb-20 max-w-3xl">
            <ChapterHeader
              label="Billing FAQ"
              heading="Common Pricing Questions."
              reduce={reduce}
            />
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion items={billingFaqs} />
          </div>
        </div>
      </section>
    </>
  );
}
