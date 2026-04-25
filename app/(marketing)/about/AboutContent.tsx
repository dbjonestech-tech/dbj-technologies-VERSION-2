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
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
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
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : " "}
        </motion.span>
      ))}
    </>
  );
}

export default function AboutContent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-40 pb-24 lg:min-h-[80vh] lg:pb-28"
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

        {/* Floating geometric accents: exactly 4 */}
        <motion.svg
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 30, repeat: Infinity, ease: "linear" }
          }
          className="pointer-events-none absolute hidden opacity-[0.12] lg:block"
          style={{ top: "12%", left: "6%", width: 65, height: 65 }}
          viewBox="0 0 60 60"
        >
          <polygon
            points="30,5 55,20 55,45 30,60 5,45 5,20"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
          />
        </motion.svg>

        <motion.svg
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 40, repeat: Infinity, ease: "linear" }
          }
          className="pointer-events-none absolute hidden opacity-[0.11] lg:block"
          style={{ top: "18%", right: "10%", width: 50, height: 50 }}
          viewBox="0 0 50 50"
        >
          <polygon
            points="25,5 45,42 5,42"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
          />
        </motion.svg>

        <motion.svg
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 25, repeat: Infinity, ease: "linear" }
          }
          className="pointer-events-none absolute opacity-[0.10]"
          style={{ bottom: "15%", left: "12%", width: 45, height: 45 }}
          viewBox="0 0 45 45"
        >
          <circle
            cx="22.5"
            cy="22.5"
            r="18"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
          />
        </motion.svg>

        <motion.svg
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 35, repeat: Infinity, ease: "linear" }
          }
          className="pointer-events-none absolute hidden opacity-[0.13] lg:block"
          style={{ bottom: "20%", right: "7%", width: 55, height: 55 }}
          viewBox="0 0 50 50"
        >
          <rect
            x="10"
            y="10"
            width="30"
            height="30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            transform="rotate(45 25 25)"
          />
        </motion.svg>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16 lg:px-8">
          {/* Photo with sibling glow */}
          <div className="relative flex-shrink-0">
            {/* Glow: sibling of clip-path container so it is not clipped */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 1.5,
                delay: prefersReducedMotion ? 0 : 0.6,
              }}
              className="absolute -inset-8 -z-10 rounded-[9999px] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              }}
            />
            {/* Clip-path reveal wrapper */}
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
            >
              <div className="relative">
                {/* Pulsing gradient border */}
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { opacity: [0.3, 0.6, 0.3] }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="absolute -inset-[2px] rounded-2xl"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6, #06060a, #3b82f6)",
                  }}
                />
                <div className="relative aspect-[3/2] w-72 flex-shrink-0 overflow-hidden rounded-2xl lg:w-[400px]">
                  <Image
                    src="/images/joshua-jones.png"
                    alt="Joshua Jones, Founder & Principal Architect"
                    fill
                    sizes="(max-width: 1024px) 288px, 400px"
                    className="object-cover"
                    quality={95}
                    priority
                    unoptimized
                  />
                </div>
              </div>
            </motion.div>
          </div>

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
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
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
        className="h-px w-full"
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
        <div className="relative mx-auto max-w-3xl px-6 py-20 lg:py-32">
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
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, #3b82f6, transparent)",
        }}
      />
      {/* Dark-to-light fade so the transition reads as continuous */}
      <div
        aria-hidden="true"
        className="h-16 w-full"
        style={{
          background: "linear-gradient(to bottom, #06060a, #FAFAFA)",
        }}
      />

      {/* Values */}
      <section className="py-20 bg-bg-secondary/50">
        <SectionHeading
          label="Core Values"
          title="What Drives Every Decision"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = valueIcons[i];
              return (
                <Card
                  key={v.title}
                  delay={i * 0.1}
                  gradientBorder
                  className="transition-shadow duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{v.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How I Work */}
      <section className="py-20">
        <SectionHeading label="How I Work" title="Operating Principles" />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative ml-4 space-y-12 border-l border-gray-200 pl-8">
            {ABOUT_CONTENT.principles.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Dot */}
                <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-[9999px] border-2 border-accent-blue/40 bg-white">
                  <div className="h-2 w-2 rounded-[9999px] bg-accent-blue" />
                </div>
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team: shown only when real team members are added */}
      {TEAM_MEMBERS.length > 0 && (
        <section className="py-32">
          <SectionHeading
            label="The Team"
            title="Meet the People Behind the Code"
            description="The people behind the work."
          />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover group p-6 text-center"
                >
                  <div
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-accent-blue/10 to-accent-violet/10 transition-all duration-500 group-hover:border-accent-blue/30"
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
                  <h3 className="font-display text-lg font-bold">{m.name}</h3>
                  <p className="mt-1 text-sm font-medium text-accent-blue">
                    {m.role}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                    {m.bio}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        heading={ABOUT_CONTENT.ctaHeading}
        highlight={ABOUT_CONTENT.ctaHighlight}
        description={ABOUT_CONTENT.ctaDescription}
        buttonText={ABOUT_CONTENT.ctaButton}
      />
    </>
  );
}
