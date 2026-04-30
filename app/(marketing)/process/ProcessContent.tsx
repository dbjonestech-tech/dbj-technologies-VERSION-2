"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

/* ─── PAGE IDENTITY ───────────────────────────────────
   Process is the silvery charcoal page. Slate-500 carries
   structural elements (chapter rulers, dots, tags, phase
   nodes, borders). Slate-400 carries luminous halos and
   pulsing glow halos. Slate-600 carries deeper accents.
   Accent-blue remains the site-wide primary CTA color so
   brand cohesion holds. The visual feeling is brushed
   titanium with soft pulsing light, like the case of a
   premium piece of hardware. */
const PAGE_ACCENT = "#64748b"; // slate-500
const PAGE_LIGHT = "#94a3b8"; // slate-400
const PAGE_DARK = "#475569"; // slate-600
const BRAND_BLUE = "#3b82f6";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/* ─── PULSING DOT ──────────────────────────────────────
   The small accent dots that sit before every mono-caps
   eyebrow tag now breathe. Opacity cycles 0.6 → 1.0 → 0.6
   over 3.6 seconds, with a subtle scale pulse. Phase node
   numbers and chapter break dots use this pattern with
   staggered delays so the page reads as alive without
   feeling busy. */
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

interface Phase {
  step: string;
  title: string;
  tagline: string;
  description: string;
  activities: string[];
}

const phases: Phase[] = [
  {
    step: "01",
    title: "Diagnose & Strategize",
    tagline: "Audit, alignment, scope. Before any code.",
    description:
      "I start every engagement with a Pathlight scan and hands-on review to find where your website is losing trust, leads, and revenue. Before I write a single line of code, I know exactly what to fix and in what order.",
    activities: [
      "Stakeholder interviews and goal alignment",
      "Competitive landscape analysis",
      "User persona and journey mapping",
      "Technical requirements definition",
      "Engagement scope, timeline, and budget agreement",
    ],
  },
  {
    step: "02",
    title: "Architect & Prototype",
    tagline: "Wireframes, designs, prototypes. Reviewed before build.",
    description:
      "I translate strategy into systems. Starting with information architecture and wireframes, I progress to high-fidelity visual designs and interactive prototypes. Every design is reviewed with you and validated before development begins.",
    activities: [
      "Information architecture and sitemap",
      "Wireframes for all key pages and flows",
      "High-fidelity visual design in Figma",
      "Interactive prototype for stakeholder review",
      "Design system and component specification",
    ],
  },
  {
    step: "03",
    title: "Engineer & Test",
    tagline: "Sprints, demos, performance, accessibility.",
    description:
      "I build with clean, typed, maintainable code on production grade frameworks. I work in focused sprints with regular demos so you see progress in real time. Every feature is tested for performance, accessibility, and cross browser compatibility.",
    activities: [
      "Architecture setup and development environment",
      "Focused sprint cycles with progress demos",
      "Performance optimization (90+ Lighthouse baseline)",
      "Accessibility testing (WCAG AA+ compliance)",
      "Cross-browser and real-device testing",
    ],
  },
  {
    step: "04",
    title: "Harden & Launch",
    tagline: "Deploy, monitor, train, hand off.",
    description:
      "I handle deployment, DNS, SSL, monitoring, and analytics setup. After launch, you get 30 days of complimentary support and a detailed handoff package with full source code and documentation.",
    activities: [
      "Production deployment and DNS configuration",
      "SSL, CDN, and caching setup",
      "Analytics and conversion tracking",
      "Training and documentation handoff",
      "30 days of post-launch support included",
    ],
  },
];

const expectations = [
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description:
      "Regular updates, shared project boards, and direct access to the architect building your system. No layers, no black boxes.",
  },
  {
    icon: DollarSign,
    title: "Fixed-Price Confidence",
    description:
      "Your budget is agreed before development begins. No scope creep, no surprise invoices, no hourly billing.",
  },
  {
    icon: ShieldCheck,
    title: "Engineering Standards",
    description:
      "90+ Lighthouse scores, WCAG AA+ accessibility, and code reviews on every pull request. I don’t ship anything I wouldn’t stake my reputation on.",
  },
];

const tools = ["Figma", "Linear", "Slack", "GitHub", "Vercel", "Notion"];

/* ─── CHAPTER HEADER ──────────────────────────────────
   Mono-caps tag + animated ruler + heading. Used for
   each section below the hero so the page reads as one
   editorial document. */
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

  // Stagger the breathing dot a bit per chapter so the page does not
  // pulse in unison. Delay derives from the chapter position when
  // available; otherwise a stable hash from the label string.
  const dotDelay =
    position !== undefined
      ? (position - 1) * 0.6
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

/* ─── PHASE LADDER (HERO SIGNATURE) ───────────────────
   Vertical 4-phase ladder with a connector line that
   draws top-to-bottom on mount. Each phase node fades
   in with a stagger, the connector line draws after
   the first node lands. This is the page's signature
   element - no other page has a numbered ladder hero. */
function PhaseLadder({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="relative">
      {/* Vertical connector line behind nodes */}
      <motion.div
        className="absolute left-6 top-12 bottom-12 w-[2px]"
        style={{
          background: `linear-gradient(180deg, ${PAGE_ACCENT} 0%, ${PAGE_ACCENT}33 100%)`,
          boxShadow: `0 0 12px ${PAGE_LIGHT}55`,
          transformOrigin: "top",
        }}
        initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          duration: reduce ? 0 : 1.5,
          ease: EASE_OUT,
          delay: reduce ? 0 : 0.3,
        }}
        aria-hidden="true"
      />

      {/* Traveling spark: a luminous segment drifts top-to-bottom along
          the connector on a slow loop, like a charge running through
          the line. Subtle but signals "process in motion." */}
      {!reduce ? (
        <motion.div
          className="absolute left-6 w-[2px] h-20 -translate-x-[0px] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${PAGE_LIGHT} 50%, transparent 100%)`,
            boxShadow: `0 0 16px 2px ${PAGE_LIGHT}aa`,
            top: "3rem",
          }}
          animate={{
            top: ["3rem", "calc(100% - 5rem)"],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 5,
            times: [0, 0.15, 0.85, 1],
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.8,
            delay: 2.5,
          }}
          aria-hidden="true"
        />
      ) : null}

      <div className="space-y-7 lg:space-y-8 relative">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.step}
            initial={
              reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduce ? 0 : 0.7,
              ease: EASE_OUT,
              delay: reduce ? 0 : 0.4 + i * 0.15,
            }}
            className="relative flex items-start gap-5 lg:gap-6 group"
          >
            {/* Number node with continuous breathing halo. Phase 01
                breathes prominently to signal "start here", phases 02
                to 04 breathe more subtly with staggered delays. */}
            <div className="relative z-10 shrink-0">
              {!reduce ? (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ backgroundColor: PAGE_LIGHT }}
                  initial={{ scale: 1, opacity: i === 0 ? 0.5 : 0.28 }}
                  animate={{
                    scale: i === 0 ? [1, 1.6, 1] : [1, 1.32, 1],
                    opacity:
                      i === 0 ? [0.45, 0, 0.45] : [0.28, 0.05, 0.28],
                  }}
                  transition={{
                    duration: i === 0 ? 2.8 : 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.2 + i * 0.55,
                  }}
                  aria-hidden="true"
                />
              ) : null}
              <div
                className="relative h-12 w-12 rounded-full flex items-center justify-center font-display text-sm font-bold text-white ring-4 ring-bg-primary"
                style={{
                  background: `linear-gradient(145deg, ${PAGE_LIGHT} 0%, ${PAGE_DARK} 100%)`,
                  boxShadow: `inset 0 1px 0 ${PAGE_LIGHT}aa, 0 6px 18px -6px ${PAGE_DARK}99`,
                }}
              >
                {phase.step}
              </div>
            </div>

            {/* Phase title and tagline */}
            <div className="pt-2.5 flex-1">
              <h3 className="font-display text-base lg:text-lg font-bold text-text-primary tracking-tight">
                {phase.title}
              </h3>
              <p className="mt-1 text-sm text-text-secondary leading-snug">
                {phase.tagline}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ProcessContent() {
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
      {/* ─── HERO: TIMELINE-AS-HERO ───────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary">
        {/* Page-identity wash: silvery slate radials at top corners,
            soft enough to read as light against the cream backdrop. */}
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

        {/* Architectural blueprint grid backdrop */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${PAGE_ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${PAGE_ACCENT} 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 xl:gap-20 items-start">
            {/* LEFT: Title block */}
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
                  My Process
                </span>
                <span className="text-text-muted/50" aria-hidden="true">
                  /
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.22em]"
                  style={{ color: PAGE_ACCENT }}
                >
                  4 Phases
                </span>
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-bold leading-[1.04] tracking-tight mb-8"
              >
                Four Phases.
                <br />
                <span style={{ color: PAGE_ACCENT }}>Zero Ambiguity.</span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="text-lg lg:text-xl text-text-secondary leading-[1.6] max-w-xl mb-10"
              >
                A structured delivery process with clear milestones, checkpoints,
                and deliverables at every stage. You always know where your
                project stands.
              </motion.p>

              <motion.div
                variants={heroItem}
                className="flex items-center gap-6 lg:gap-8 mb-10"
              >
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    4
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Phases
                  </span>
                </div>
                <div
                  className="h-8 w-px bg-text-primary/15"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    0
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Surprises
                  </span>
                </div>
                <div
                  className="h-8 w-px bg-text-primary/15"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-display text-3xl lg:text-4xl font-bold leading-none"
                    style={{ color: PAGE_ACCENT }}
                  >
                    1
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Architect
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
                  Start a Project
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#phases"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-text-primary/30 hover:border-text-primary transition-colors pb-1"
                >
                  See Phase Details
                </Link>
              </motion.div>
            </motion.div>

            {/* RIGHT: Phase Ladder signature element */}
            <div className="relative">
              {/* Outer breathing halo. The card glows softly and pulses
                  on a slow loop, reading as a piece of brushed-metal
                  hardware lit from underneath. Two stacked halos with
                  offset timings produce a subtle shimmering shift. */}
              {!reduce ? (
                <>
                  <motion.div
                    className="absolute -inset-8 lg:-inset-12 -z-10 blur-3xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${PAGE_LIGHT} 0%, transparent 70%)`,
                    }}
                    animate={{ opacity: [0.18, 0.36, 0.18] }}
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
                      background: `radial-gradient(ellipse at 40% 30%, ${PAGE_ACCENT} 0%, transparent 60%)`,
                    }}
                    animate={{ opacity: [0.12, 0.24, 0.12] }}
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
                className="relative rounded-2xl lg:rounded-3xl border-2 p-8 lg:p-10 transform-gpu"
                style={{
                  borderColor: `${PAGE_ACCENT}40`,
                  background: `linear-gradient(180deg, #ffffff 0%, ${PAGE_LIGHT}10 100%)`,
                  boxShadow: `0 40px 100px -30px ${PAGE_ACCENT}55, 0 20px 40px -15px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)`,
                }}
              >
                <div className="flex items-center gap-2.5 mb-7">
                  <PulsingDot reduce={reduce} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                    Engagement Ladder
                  </span>
                </div>
                <PhaseLadder reduce={reduce} />
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

      {/* ─── PHASE DEEP-DIVES ─────────────────────────── */}
      <section
        id="phases"
        className="relative py-24 lg:py-32 scroll-mt-24"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="mb-20 lg:mb-28 max-w-3xl">
            <ChapterHeader
              label="The Plan"
              heading="From Diagnosis to Deployment."
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
              Each phase has clear deliverables and sign-offs so nothing moves
              forward without your approval.
            </motion.p>
          </div>

          {phases.map((phase, i) => (
            <motion.article
              key={phase.step}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="mb-24 lg:mb-32 last:mb-0"
            >
              <ChapterHeader
                label="Phase"
                heading={phase.title}
                position={i + 1}
                total={phases.length}
                reduce={reduce}
              />

              <div className="mt-12 lg:mt-16 grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16">
                {/* Left: phase description */}
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
                  <p className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary">
                    {phase.description}
                  </p>
                </motion.div>

                {/* Right: activities list */}
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
                      What Happens
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {phase.activities.map((activity) => (
                      <motion.li
                        key={activity}
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
                        <span>{activity}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ─── WHAT TO EXPECT ───────────────────────────── */}
      <section className="relative py-24 lg:py-32 border-t border-text-primary/8 bg-bg-secondary/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="max-w-3xl mb-16 lg:mb-20">
            <ChapterHeader
              label="What to Expect"
              heading="The Client Experience."
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
              Working with me should feel structured, not stressful.
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
            className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {expectations.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
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
                  className="relative rounded-2xl border bg-bg-primary p-7 lg:p-8 transition-all motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
                  style={{ borderColor: `${PAGE_ACCENT}22` }}
                >
                  <div
                    className="absolute left-0 top-7 lg:top-8 bottom-7 lg:bottom-8 w-[2px] rounded-full"
                    style={{ backgroundColor: `${PAGE_ACCENT}55` }}
                    aria-hidden="true"
                  />
                  <div className="pl-2">
                    <div
                      className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${PAGE_ACCENT}14`,
                        color: PAGE_ACCENT,
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg lg:text-xl font-bold text-text-primary mb-3">
                      {item.title}
                    </h3>
                    <p className="text-[0.95rem] leading-[1.7] text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── TOOLKIT ──────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 border-t border-text-primary/8">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="max-w-3xl mb-16 lg:mb-20">
            <ChapterHeader
              label="My Toolkit"
              heading="Tools I Use."
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
              Best-in-class tools for project management, design, and
              communication.
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
                  : { staggerChildren: 0.06, delayChildren: 0.2 },
              },
            }}
            className="flex flex-wrap gap-3"
          >
            {tools.map((tool) => (
              <motion.span
                key={tool}
                variants={{
                  hidden: reduce
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.94 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      duration: reduce ? 0 : 0.5,
                      ease: EASE_OUT,
                    },
                  },
                }}
                className="inline-flex items-center px-5 py-2.5 rounded-full font-mono text-sm font-medium text-text-primary transition-all motion-safe:hover:-translate-y-0.5"
                style={{
                  backgroundColor: `${PAGE_ACCENT}10`,
                  border: `1px solid ${PAGE_ACCENT}33`,
                }}
              >
                {tool}
              </motion.span>
            ))}
          </motion.div>
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
                Phase Zero Begins With a Conversation
              </span>
            </motion.div>
            <motion.h3
              variants={heroItem}
              className="font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-[1.1] tracking-tight mb-6"
            >
              Ready to Get Started? Phase One Awaits.
            </motion.h3>
            <motion.p
              variants={heroItem}
              className="text-text-secondary leading-relaxed mb-8 lg:text-lg max-w-2xl"
            >
              The first step is a conversation. Tell me about your project and I
              will outline how I would approach it, including timeline, scope,
              and cost.
            </motion.p>
            <motion.div variants={heroItem}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Start Discovery
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
