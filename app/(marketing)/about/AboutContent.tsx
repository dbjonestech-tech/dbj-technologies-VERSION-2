"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
          className="pointer-events-none absolute hidden opacity-[0.08] lg:block"
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
          className="pointer-events-none absolute hidden opacity-[0.06] lg:block"
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
          className="pointer-events-none absolute opacity-[0.07]"
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
          className="pointer-events-none absolute hidden opacity-[0.09] lg:block"
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
              <div className="relative aspect-[3/2] w-72 flex-shrink-0 lg:w-[400px]">
                <Image
                  src="/images/joshua-jones.png"
                  alt="Joshua Jones, Founder & Principal Architect"
                  fill
                  sizes="(max-width: 1024px) 288px, 400px"
                  className="rounded-2xl object-cover shadow-2xl"
                  quality={95}
                  priority
                  unoptimized
                />
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
                    {char === " " ? " " : char}
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
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed lg:mx-0"
              style={{ color: "#8892a4" }}
            >
              {ABOUT_STORY.personal}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Gradient divider between hero and story */}
      <div
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
              className="mb-20 last:mb-0"
            >
              {/* Accent line before heading */}
              <div
                className="mb-4 h-px w-16"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6, transparent)",
                }}
              />
              <h3 className="mb-6 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                {section.heading}
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#9ca3af" }}
              >
                {section.body}
              </p>
              {i === storySections.length - 1 && (
                <div className="mt-8">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:gap-3"
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
      <div
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
