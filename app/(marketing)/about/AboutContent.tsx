"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import {
  Zap,
  Eye,
  Target,
  Heart,
  Activity,
  Gauge,
  Mail,
  ShieldCheck,
  Workflow,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import {
  TEAM_MEMBERS,
  VALUES,
  ABOUT_CONTENT,
  ABOUT_STORY,
} from "@/lib/constants";

const valueIcons = [Zap, Eye, Target, Heart];

const headlineChars = ABOUT_CONTENT.headline.split("");

/* ─── CANOPY CAPABILITY TILES ──────────────────────
   The 6 tiles surfaced on the About page as proof-of-craft
   for the Canopy engagement. Body copy is outcome-led and
   avoids exposing Pathlight internals. */
const OPS_CAPABILITIES = [
  {
    icon: Activity,
    title: "First-party analytics",
    body: "Visitor, session, and funnel data joined to actual business outcomes. No vendor between you and your numbers.",
  },
  {
    icon: Gauge,
    title: "Real-user performance",
    body: "Core Web Vitals from real visitors, not synthetic tests. The metrics Google actually uses to rank you.",
  },
  {
    icon: Mail,
    title: "Deliverability monitoring",
    body: "Sent, delivered, bounced, complained. Joined to the sending platform so you see problems before they cost domain reputation.",
  },
  {
    icon: ShieldCheck,
    title: "Infrastructure watchers",
    body: "Daily TLS, WHOIS, and DNS authentication checks across every domain. Pages me before a cert expires, not after.",
  },
  {
    icon: Workflow,
    title: "Pipeline observability",
    body: "Function health, retry behavior, and success rates for every async job that runs in the background.",
  },
  {
    icon: Receipt,
    title: "Cost telemetry",
    body: "Every third-party API call tracked by provider, operation, and run. No surprise invoices.",
  },
] as const;

const storySections = [
  ABOUT_STORY.whyThisWay,
  ABOUT_STORY.whatYouGet,
  ABOUT_STORY.howIBuild,
  ABOUT_STORY.whoThisIsFor,
];

/* ─── AMBIENT PARTICLES ────────────────────────────
   Static, deterministic positions / motion deltas so SSR and
   client agree byte-for-byte. CSS-driven animation only. */
const AMBIENT_PARTICLES = [
  { top: "8%", left: "12%", size: 2, dur: 18, dx: 30, dy: -20 },
  { top: "15%", right: "8%", size: 3, dur: 22, dx: -25, dy: 15 },
  { top: "25%", left: "4%", size: 2, dur: 20, dx: 20, dy: 25 },
  { top: "32%", right: "15%", size: 2.5, dur: 24, dx: -15, dy: -30 },
  { top: "45%", left: "18%", size: 2, dur: 16, dx: 35, dy: 10 },
  { top: "52%", right: "5%", size: 3, dur: 26, dx: -20, dy: 20 },
  { top: "60%", left: "8%", size: 2, dur: 19, dx: 15, dy: -25 },
  { top: "70%", right: "12%", size: 2.5, dur: 23, dx: -30, dy: -10 },
  { top: "78%", left: "25%", size: 2, dur: 21, dx: 25, dy: 15 },
  { top: "85%", right: "20%", size: 3, dur: 17, dx: -10, dy: -20 },
  { top: "12%", left: "45%", size: 2, dur: 25, dx: -15, dy: 30 },
  { top: "40%", left: "35%", size: 2.5, dur: 20, dx: 20, dy: -15 },
  { top: "65%", right: "30%", size: 2, dur: 22, dx: -25, dy: 10 },
  { top: "90%", left: "15%", size: 2, dur: 19, dx: 10, dy: -25 },
  { top: "5%", right: "35%", size: 2.5, dur: 24, dx: -20, dy: 20 },
  { top: "55%", left: "50%", size: 2, dur: 18, dx: 15, dy: -10 },
] as const;

function AmbientParticles() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {AMBIENT_PARTICLES.map((p, i) => {
        const style: React.CSSProperties & Record<string, string | number> = {
          top: p.top,
          width: p.size,
          height: p.size,
          backgroundColor: "#3b82f6",
          opacity: 0.06 + (i % 3) * 0.02,
          animation: `about-particle-drift ${p.dur}s ease-in-out infinite alternate`,
          willChange: "transform",
          "--dx": `${p.dx}px`,
          "--dy": `${p.dy}px`,
        };
        if ("left" in p) style.left = p.left;
        if ("right" in p) style.right = p.right;
        return (
          <div
            key={i}
            className="about-particle pointer-events-none absolute rounded-full"
            style={style}
          />
        );
      })}
    </div>
  );
}

/* ─── SCROLL REVEAL TEXT (3-word batched word illumination) ─── */
function ScrollRevealText({ text }: { text: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end 0.4"],
  });

  const words = text.split(" ");
  const batches: string[][] = [];
  for (let i = 0; i < words.length; i += 3) {
    batches.push(words.slice(i, i + 3));
  }

  return (
    <p ref={containerRef} className="text-lg leading-relaxed">
      {batches.map((batch, i) => {
        const start = i / batches.length;
        const end = Math.min(start + 1.5 / batches.length, 1);
        return (
          <ScrollWordBatch
            key={i}
            words={batch}
            range={[start, end]}
            progress={scrollYProgress}
          />
        );
      })}
    </p>
  );
}

function ScrollWordBatch({
  words,
  range,
  progress,
}: {
  words: string[];
  range: [number, number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, range, [0.3, 1]);
  const color = useTransform(progress, range, ["#4b5563", "#d1d5db"]);

  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ opacity, color }}
          /* `inline` (not `inline-block`): inline-block collapses
             trailing whitespace inside the box, which ate the space
             after the last word of each batch and produced
             "smartdecisions", "buriedby", etc. on the live site.
             Single concatenated text child (not two adjacent
             children): two text children inside motion.span produced
             an intermittent hydration mismatch ("Failed to execute
             'insertBefore'") because React 18's text-marker
             insertion is unreliable through framer-motion's
             forwardRef wrapper. One string = one DOM text node = no
             mismatch. */
          className="inline"
        >
          {word + (i < words.length - 1 ? "\u00A0" : " ")}
        </motion.span>
      ))}
    </>
  );
}

/* ─── SCROLL PROGRESS CARD WRAPPER ─────────────────
   Vertical blue line on the card's left edge that fills as
   the card scrolls through the viewport. */
function ScrollProgressCard({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean | null;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="relative">
      {!reduce && (
        <motion.div
          aria-hidden="true"
          style={{ scaleY, transformOrigin: "top" }}
          className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-accent-blue/60"
        />
      )}
      <div className="pl-6">{children}</div>
    </div>
  );
}

/* ─── PARALLAX PHOTO WRAPPER ───────────────────────
   Translates the photo column at 0.6x of its own scroll
   range, creating physical depth against the text column. */
function ParallaxPhoto({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean | null;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* ─── MAGAZINE CHAPTER HELPERS ─────────────────────
   Shared motion language across the post-hero sections.
   EASE_OUT and VIEWPORT match the design-brief and
   case-study renderers so the entire site reads as one
   editorial document. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;
const ACCENT = "#3b82f6";

function ChapterHeader({
  label,
  heading,
  accent,
  reduce,
  position,
  total,
  align = "left",
}: {
  label: string;
  heading: string;
  accent: string;
  reduce: boolean | null;
  position?: number;
  total?: number;
  align?: "left" | "center";
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

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      <div
        className={`flex items-center gap-4 lg:gap-6 mb-8 lg:mb-10 ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        <motion.div
          variants={tagV}
          className="flex items-center gap-2.5 shrink-0"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">
            {label}
          </span>
          {position !== undefined && total !== undefined ? (
            <>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {String(position).padStart(2, "0")}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/30">
                / {String(total).padStart(2, "0")}
              </span>
            </>
          ) : null}
        </motion.div>
        <motion.span
          variants={rulerV}
          className="h-[2px] flex-1 origin-left"
          style={{
            background: `linear-gradient(90deg, ${accent} 0%, ${accent}11 100%)`,
          }}
          aria-hidden="true"
        />
      </div>
      <motion.h2
        variants={headingV}
        className={`font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-tight text-white max-w-4xl ${
          align === "center" ? "mx-auto text-center" : ""
        }`}
      >
        {heading}
      </motion.h2>
    </motion.div>
  );
}

function ChapterArticle({
  index,
  total,
  accent,
  heading,
  body,
  reduce,
  showCTA,
}: {
  index: number;
  total: number;
  accent: string;
  heading: string;
  body: string;
  reduce: boolean | null;
  showCTA: boolean;
}) {
  return (
    <article className="mb-24 lg:mb-32 last:mb-0">
      <ChapterHeader
        label="Chapter"
        heading={heading}
        accent={accent}
        reduce={reduce}
        position={index + 1}
        total={total}
      />
      <ScrollProgressCard reduce={reduce}>
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{
            duration: reduce ? 0 : 0.7,
            ease: EASE_OUT,
            delay: 0.3,
          }}
          className="mt-10 lg:mt-12 max-w-3xl"
        >
          {reduce ? (
            <p className="text-lg leading-[1.85]" style={{ color: "#c5ccd8" }}>
              {body}
            </p>
          ) : (
            <ScrollRevealText text={body} />
          )}
          {showCTA ? (
            <div className="mt-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg"
                style={{ backgroundColor: accent }}
              >
                Start a Conversation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </motion.div>
      </ScrollProgressCard>
    </article>
  );
}

export default function AboutContent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative" style={{ backgroundColor: "#06060a" }}>
      {/* Page-spanning ambient particle layer (CSS-only motion) */}
      <AmbientParticles />

      {/* Hero */}
      <section
        className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-20"
        style={{ backgroundColor: "#06060a" }}
      >
        {/* Dark-friendly dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Vignette so blob bleed stays contained */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(6,6,10,0.6), transparent 25%, transparent 75%, rgba(6,6,10,0.9))",
          }}
        />
        {/* One-shot scan line: sweeps down on page load */}
        {!prefersReducedMotion && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
            className="pointer-events-none absolute left-0 right-0 z-[1] h-px opacity-20"
            style={{
              background:
                "linear-gradient(to right, transparent, #3b82f6, transparent)",
              boxShadow: "0 0 15px 3px rgba(59,130,246,0.3)",
            }}
            aria-hidden="true"
          />
        )}
        <GradientBlob className="-top-40 -right-40" />

        <div className="relative z-[2] mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16 lg:px-8 xl:max-w-7xl">
          {/* Photo column with parallax */}
          <ParallaxPhoto reduce={prefersReducedMotion}>
            <div className="relative w-80 lg:w-[600px] xl:w-[720px]">
              {/* Atmospheric blue glow behind photo */}
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.18 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 1.5,
                  delay: prefersReducedMotion ? 0 : 0.6,
                }}
                className="absolute -inset-12 -z-10 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, #3b82f6 0%, transparent 65%)",
                }}
              />
              {/* Clip-path reveal applied to the photo container. The
                  source webp carries its own alpha (RGBA, color_type 6),
                  so no maskImage is needed; adding one would trim the
                  silhouette at the mask's edges. */}
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { clipPath: "inset(0 100% 0 0)", opacity: 0.8 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { clipPath: "inset(0 0% 0 0)", opacity: 1 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 1.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative aspect-[3/2]"
              >
                <Image
                  src="/images/joshua-jones.webp"
                  alt="Joshua Jones, Founder & Principal Architect"
                  fill
                  sizes="(max-width: 1024px) 320px, (max-width: 1280px) 600px, 720px"
                  className="object-cover"
                  quality={95}
                  priority
                />
              </motion.div>
            </div>
          </ParallaxPhoto>

          {/* Text column */}
          <div className="flex-1 text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-block rounded-[9999px] border border-accent-blue/30 bg-accent-blue/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue"
            >
              {ABOUT_CONTENT.badge}
            </motion.span>
            {/* Sized to fit alongside the enlarged photo column without
                breaking the headline mid-word. Each character is its own
                inline-block (for the y-translate stagger), so when the
                text overflows its column the browser wraps at character
                boundaries; that is how "Anti-Agen / cy" used to appear.
                Column math (post-photo enlargement):
                  - md and below: stacked, headline gets full width.
                  - lg (max-w-6xl, photo 600): text col ~424px, drop to text-5xl (~385px).
                  - xl (max-w-7xl, photo 720): text col ~432px, stay at text-5xl.
                If the photo ever shrinks back, lg+ can return to text-6xl. */}
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-5xl">
              <span className="sr-only">
                {ABOUT_CONTENT.headline} {ABOUT_CONTENT.headlineAccent}
              </span>
              <span aria-hidden="true" className="block">
                {headlineChars.map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.02, duration: 0.3 }}
                    style={{ display: "inline-block" }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </span>
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-gradient mt-1 inline-block"
              >
                {ABOUT_CONTENT.headlineAccent}
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed lg:mx-0"
              style={{ color: "#c5ccd8" }}
            >
              {ABOUT_CONTENT.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-8 mb-4 flex items-center justify-center gap-3 lg:justify-start"
              aria-hidden="true"
            >
              <div
                className="h-px w-8"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6, transparent)",
                }}
              />
              <div className="h-1.5 w-1.5 rounded-sm bg-accent-blue/40" />
              <div
                className="h-px w-8"
                style={{
                  background:
                    "linear-gradient(to left, #3b82f6, transparent)",
                }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto max-w-2xl text-sm leading-relaxed lg:mx-0"
              style={{ color: "#8892a4" }}
            >
              {ABOUT_STORY.personal}
            </motion.p>

            {/* Scroll indicator */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="mt-12 flex justify-center lg:justify-start"
                aria-hidden="true"
              >
                <svg
                  width="20"
                  height="30"
                  viewBox="0 0 20 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="1"
                    width="18"
                    height="28"
                    rx="9"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                  <motion.circle
                    cx="10"
                    cy="10"
                    r="2.5"
                    fill="#3b82f6"
                    fillOpacity="0.6"
                    animate={{ cy: [10, 20, 10] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2,
                    }}
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Story sections - magazine chapter breaks */}
      <section
        id="story"
        className="relative overflow-hidden py-24 lg:py-32 scroll-mt-24"
        style={{ backgroundColor: "#06060a" }}
      >
        {/* Dark dot grid backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-[2] mx-auto max-w-[1400px] px-6 lg:px-12">
          {storySections.map((section, i) => (
            <ChapterArticle
              key={section.heading}
              index={i}
              total={storySections.length}
              accent={ACCENT}
              heading={section.heading}
              body={section.body}
              reduce={prefersReducedMotion}
              showCTA={i === storySections.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Core Values - chapter break + minimal grid */}
      <section
        className="relative overflow-hidden py-24 lg:py-32 border-t border-white/5"
        style={{ backgroundColor: "#06060a" }}
      >
        <div className="relative z-[2] mx-auto max-w-[1400px] px-6 lg:px-12">
          <ChapterHeader
            label="Core Values"
            heading="What Drives Every Decision."
            accent={ACCENT}
            reduce={prefersReducedMotion}
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: prefersReducedMotion
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            className="mt-16 lg:mt-20 grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-14"
          >
            {VALUES.map((v, i) => {
              const Icon = valueIcons[i];
              return (
                <motion.div
                  key={v.title}
                  variants={{
                    hidden: prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: prefersReducedMotion ? 0 : 0.7,
                        ease: EASE_OUT,
                      },
                    },
                  }}
                  className="relative"
                >
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue ring-1 ring-accent-blue/20"
                  >
                    {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
                  </div>
                  <h3 className="font-display text-lg lg:text-xl font-bold text-white mb-3">
                    {v.title}
                  </h3>
                  <p
                    className="text-[0.95rem] leading-[1.7]"
                    style={{ color: "#9ca3af" }}
                  >
                    {v.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Operating Principles - chapter break + timeline */}
      <section
        className="relative overflow-hidden py-24 lg:py-32 border-t border-white/5"
        style={{ backgroundColor: "#06060a" }}
      >
        <div className="relative z-[2] mx-auto max-w-[1400px] px-6 lg:px-12">
          <ChapterHeader
            label="How I Work"
            heading="Operating Principles."
            accent={ACCENT}
            reduce={prefersReducedMotion}
          />
          <div className="mt-16 lg:mt-20 mx-auto max-w-3xl">
            <div className="relative ml-4 space-y-12 border-l border-white/10 pl-8 lg:pl-10">
              {ABOUT_CONTENT.principles.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -20 }
                  }
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={VIEWPORT}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.7,
                    delay: prefersReducedMotion ? 0 : i * 0.1,
                    ease: EASE_OUT,
                  }}
                  className="relative"
                >
                  <div
                    className="absolute -left-[45px] lg:-left-[51px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-blue/40"
                    style={{ backgroundColor: "#06060a" }}
                  >
                    <div className="h-2 w-2 rounded-full bg-accent-blue" />
                  </div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p
                    className="mt-3 text-[0.95rem] lg:text-base leading-[1.75]"
                    style={{ color: "#c5ccd8" }}
                  >
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Built for Myself First (Canopy showcase) */}
      <section
        className="relative overflow-hidden py-24 lg:py-32 border-t border-white/5"
        style={{ backgroundColor: "#06060a" }}
      >
        <div className="relative z-[2] mx-auto max-w-[1400px] px-6 lg:px-12">
          <ChapterHeader
            label="The Stack Behind the Studio"
            heading="Built for Myself First."
            accent={ACCENT}
            reduce={prefersReducedMotion}
          />
          <motion.p
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.7,
              ease: EASE_OUT,
              delay: 0.25,
            }}
            className="mt-10 max-w-3xl text-base leading-[1.75] sm:text-lg"
            style={{ color: "#c5ccd8" }}
          >
            Most agencies hand you a website and tell you to outsource the rest
            to five different SaaS vendors. I built an operations stack for the
            studio myself. First-party analytics, real-user performance,
            deliverability, infrastructure watchers, error tracking, and
            pipeline health. One auth wall. One database. One source of truth.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={{
              hidden: {},
              visible: {
                transition: prefersReducedMotion
                  ? { staggerChildren: 0 }
                  : { staggerChildren: 0.08, delayChildren: 0.35 },
              },
            }}
            className="mt-16 lg:mt-20 grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {OPS_CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  variants={{
                    hidden: prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: prefersReducedMotion ? 0 : 0.7,
                        ease: EASE_OUT,
                      },
                    },
                  }}
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: -8,
                          transition: { duration: 0.35, ease: EASE_OUT },
                        }
                  }
                  className="group relative rounded-2xl border p-7 lg:p-8 overflow-hidden cursor-default"
                  style={{
                    borderColor: "rgba(59,130,246,0.18)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(59,130,246,0.04) 100%)",
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.08)",
                      "inset 0 0 0 1px rgba(255,255,255,0.03)",
                      "0 1px 2px rgba(0,0,0,0.3)",
                      "0 18px 48px -18px rgba(59,130,246,0.35)",
                      "0 48px 100px -36px rgba(59,130,246,0.18)",
                    ].join(", "),
                  }}
                >
                  {/* Hover halo behind card on dark surface */}
                  <span
                    className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100 -z-10"
                    style={{
                      boxShadow: [
                        "0 32px 80px -16px rgba(59,130,246,0.6)",
                        "0 80px 160px -32px rgba(59,130,246,0.35)",
                        "0 0 0 1px rgba(96,165,250,0.45)",
                      ].join(", "),
                    }}
                    aria-hidden="true"
                  />
                  {/* Top edge highlight on dark surface (base + hover) */}
                  <div
                    className="absolute top-0 left-5 right-5 h-px pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.7) 50%, transparent 100%)",
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute top-0 left-5 right-5 h-px pointer-events-none opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(191,219,254,1) 50%, transparent 100%)",
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute left-0 top-7 lg:top-8 bottom-7 lg:bottom-8 w-[2px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(147,197,253,0.9) 0%, rgba(59,130,246,0.7) 50%, rgba(30,64,175,0.6) 100%)",
                      boxShadow: "0 0 8px rgba(59,130,246,0.55)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="pl-2">
                    <div
                      className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl text-accent-blue transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(147,197,253,0.18) 0%, rgba(59,130,246,0.10) 100%)",
                        boxShadow:
                          "inset 0 1px 0 rgba(147,197,253,0.40), 0 0 0 1px rgba(59,130,246,0.25)",
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg lg:text-xl font-bold text-white mb-3">
                      {cap.title}
                    </h3>
                    <p
                      className="text-[0.95rem] leading-[1.7]"
                      style={{ color: "#9ca3af" }}
                    >
                      {cap.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 20 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.7,
              ease: EASE_OUT,
              delay: 0.2,
            }}
            className="mt-16 lg:mt-20 max-w-3xl"
          >
            <p
              className="text-base leading-[1.75] sm:text-lg"
              style={{ color: "#c5ccd8" }}
            >
              I built it because I needed it. If you want the same stack on your
              domain, I will build it for you. Same architecture. Your data.
              Your auth wall.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/pricing/canopy"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_18px_40px_-15px_rgba(59,130,246,0.6)]"
                style={{ backgroundColor: ACCENT }}
              >
                See Pricing
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact?topic=canopy"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border-b border-white/30 hover:border-white transition-colors pb-1"
              >
                Request a Private Walkthrough
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team: shown only when real team members are added */}
      {TEAM_MEMBERS.length > 0 && (
        <section
          className="relative overflow-hidden py-24 lg:py-32 border-t border-white/5"
          style={{ backgroundColor: "#06060a" }}
        >
          <div className="relative z-[2] mx-auto max-w-[1400px] px-6 lg:px-12">
            <ChapterHeader
              label="Team"
              heading="Meet the People Behind the Code."
              accent={ACCENT}
              reduce={prefersReducedMotion}
            />
            <div className="mt-16 lg:mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.7,
                    delay: prefersReducedMotion ? 0 : i * 0.1,
                    ease: EASE_OUT,
                  }}
                >
                  <div
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]"
                    role="img"
                    aria-label={`Avatar for ${m.name}`}
                  >
                    <span
                      className="font-display text-2xl font-bold text-gradient"
                      aria-hidden="true"
                    >
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {m.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent-blue">
                    {m.role}
                  </p>
                  <p
                    className="mt-3 text-[0.9rem] leading-[1.7]"
                    style={{ color: "#9ca3af" }}
                  >
                    {m.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA wrapped so the shared CTASection renders dark on /about */}
      <div className="about-cta-dark relative z-[2]">
        <CTASection
          heading={ABOUT_CONTENT.ctaHeading}
          highlight={ABOUT_CONTENT.ctaHighlight}
          description={ABOUT_CONTENT.ctaDescription}
          buttonText={ABOUT_CONTENT.ctaButton}
        />
      </div>
    </div>
  );
}
