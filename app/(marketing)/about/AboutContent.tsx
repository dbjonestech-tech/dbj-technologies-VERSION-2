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
} from "framer-motion";
import { Zap, Eye, Target, Heart } from "lucide-react";
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

      {/* Gradient divider between hero and story */}
      <motion.div
        initial={{ opacity: 0.3, scaleX: 0.6 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        aria-hidden="true"
        className="relative z-[2] h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, #3b82f6, transparent)",
        }}
      />

      {/* Story sections (dark) */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#06060a" }}
      >
        {/* Dark-friendly dot grid, same as hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-[2] mx-auto max-w-3xl px-6 py-20 lg:py-32">
          {storySections.map((section, i) => (
            <motion.div
              key={section.heading}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="mb-12 last:mb-0 rounded-xl border border-white/[0.06] p-8 lg:p-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              }}
            >
              <ScrollProgressCard reduce={prefersReducedMotion}>
                {/* Accent line before heading */}
                <div
                  className="mb-4 h-px w-16"
                  style={{
                    background:
                      "linear-gradient(to right, #3b82f6, transparent)",
                  }}
                />
                <motion.h3
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mb-6 text-2xl font-semibold tracking-tight lg:text-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {section.heading}
                </motion.h3>
                {prefersReducedMotion ? (
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: "#9ca3af" }}
                  >
                    {section.body}
                  </p>
                ) : (
                  <ScrollRevealText text={section.body} />
                )}
                {i === storySections.length - 1 && (
                  <div className="mt-8">
                    <Link
                      href="/contact"
                      className="inline-flex transform items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:gap-3 hover:shadow-[0_0_20px_-2px_rgba(59,130,246,0.4)] hover:brightness-110"
                      style={{ backgroundColor: "#3b82f6" }}
                    >
                      Start a Conversation
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </ScrollProgressCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gradient divider between story and values */}
      <motion.div
        initial={{ opacity: 0.3, scaleX: 0.6 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        aria-hidden="true"
        className="relative z-[2] h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, #3b82f6, transparent)",
        }}
      />

      {/* Values (dark glass cards) */}
      <section
        className="relative overflow-hidden py-20"
        style={{ backgroundColor: "#06060a" }}
      >
        <div className="relative z-[2] mb-16 mx-auto max-w-3xl text-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-accent-blue"
          >
            Core Values
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 font-display text-section font-bold leading-tight text-white"
          >
            What Drives Every Decision
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 h-[1px] w-24 mx-auto bg-gradient-to-r from-accent-blue to-accent-cyan"
          />
        </div>
        <div className="relative z-[2] mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = valueIcons[i];
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border border-white/[0.06] p-6 transition-shadow duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.25)] md:p-8"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    {Icon && <Icon className="h-6 w-6" aria-hidden="true" />}
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {v.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#9ca3af" }}
                  >
                    {v.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How I Work (dark) */}
      <section
        className="relative overflow-hidden py-20"
        style={{ backgroundColor: "#06060a" }}
      >
        <div className="relative z-[2] mb-16 mx-auto max-w-3xl text-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-accent-blue"
          >
            How I Work
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 font-display text-section font-bold leading-tight text-white"
          >
            Operating Principles
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 h-[1px] w-24 mx-auto bg-gradient-to-r from-accent-blue to-accent-cyan"
          />
        </div>
        <div className="relative z-[2] mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative ml-4 space-y-12 border-l border-white/10 pl-8">
            {ABOUT_CONTENT.principles.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div
                  className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-[9999px] border-2 border-accent-blue/40"
                  style={{ backgroundColor: "#06060a" }}
                >
                  <div className="h-2 w-2 rounded-[9999px] bg-accent-blue" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "#9ca3af" }}
                >
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team: shown only when real team members are added */}
      {TEAM_MEMBERS.length > 0 && (
        <section
          className="relative overflow-hidden py-32"
          style={{ backgroundColor: "#06060a" }}
        >
          <div className="relative z-[2] mb-16 mx-auto max-w-3xl text-center px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-section font-bold leading-tight text-white"
            >
              Meet the People Behind the Code
            </motion.h2>
          </div>
          <div className="relative z-[2] mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-white/[0.06] p-6 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  }}
                >
                  <div
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10"
                    role="img"
                    aria-label={`Avatar for ${m.name}`}
                  >
                    <span
                      className="font-display text-3xl font-bold text-gradient"
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
                    className="mt-3 text-xs leading-relaxed"
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
