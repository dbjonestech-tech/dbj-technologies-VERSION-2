"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, Eye, Target, Heart } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { TEAM_MEMBERS, VALUES, ABOUT_CONTENT } from "@/lib/constants";

const valueIcons = [Zap, Eye, Target, Heart];

type Shape = "hexagon" | "triangle" | "ring";

const floatingShapes: Array<{
  top: string;
  left?: string;
  right?: string;
  size: number;
  duration: number;
  shape: Shape;
  hideOnMobile?: boolean;
}> = [
  { top: "14%", left: "5%", size: 70, duration: 34, shape: "hexagon" },
  { top: "22%", right: "7%", size: 48, duration: 24, shape: "triangle", hideOnMobile: true },
  { top: "68%", left: "9%", size: 58, duration: 28, shape: "ring", hideOnMobile: true },
  { top: "58%", right: "10%", size: 82, duration: 40, shape: "hexagon", hideOnMobile: true },
  { top: "40%", right: "3%", size: 38, duration: 22, shape: "ring" },
  { top: "82%", left: "46%", size: 52, duration: 36, shape: "triangle", hideOnMobile: true },
];

function ShapeSVG({ shape, size }: { shape: Shape; size: number }) {
  const stroke = "#3b82f6";
  if (shape === "hexagon") {
    return (
      <svg viewBox="0 0 60 60" width={size} height={size}>
        <polygon points="30,4 55,18 55,42 30,56 5,42 5,18" fill="none" stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg viewBox="0 0 60 60" width={size} height={size}>
        <polygon points="30,6 56,52 4,52" fill="none" stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <circle cx="30" cy="30" r="26" fill="none" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

const headlineChars = ABOUT_CONTENT.headline.split("");

export default function AboutContent() {
  const reduce = useReducedMotion();

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-40 pb-24 lg:pb-28"
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
        {/* Vignette so GradientBlob bleed stays contained */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(6,6,10,0.6), transparent 25%, transparent 75%, rgba(6,6,10,0.9))",
          }}
        />
        <GradientBlob className="-top-40 -right-40" />

        {/* Floating geometric accents */}
        {floatingShapes.map((s, i) => (
          <motion.div
            key={i}
            aria-hidden="true"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={
              reduce
                ? undefined
                : { duration: s.duration, repeat: Infinity, ease: "linear" }
            }
            className={`pointer-events-none absolute opacity-[0.09] ${
              s.hideOnMobile ? "hidden lg:block" : ""
            }`}
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              width: s.size,
              height: s.size,
            }}
          >
            <ShapeSVG shape={s.shape} size={s.size} />
          </motion.div>
        ))}

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16 lg:px-8">
          {/* Photo */}
          <motion.div
            initial={
              reduce
                ? { opacity: 1 }
                : { clipPath: "inset(0 100% 0 0)", opacity: 0.8 }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { clipPath: "inset(0 0% 0 0)", opacity: 1 }
            }
            transition={{
              duration: reduce ? 0 : 1.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative shrink-0"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-full opacity-20 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              }}
            />
            <div className="relative h-72 w-56 overflow-hidden rounded-2xl shadow-2xl lg:h-96 lg:w-72">
              <Image
                src="/images/joshua-jones.png"
                alt="Joshua Jones, Founder & Principal Architect"
                fill
                sizes="(min-width: 1024px) 288px, 224px"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.1, duration: reduce ? 0 : 0.4 }}
              className="inline-block rounded-full border border-accent-blue/30 bg-accent-blue/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue"
            >
              {ABOUT_CONTENT.badge}
            </motion.span>
            <h1 className="mt-6 font-display text-section font-bold leading-tight text-white">
              <span className="inline-block">
                <span className="sr-only">{ABOUT_CONTENT.headline}</span>
                <span aria-hidden="true">
                  {headlineChars.map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduce ? 0 : 0.4 + i * 0.02,
                        duration: reduce ? 0 : 0.3,
                      }}
                      className="inline-block"
                    >
                      {char === " " ? " " : char}
                    </motion.span>
                  ))}
                </span>
              </span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.8, duration: reduce ? 0 : 0.5 }}
                className="text-gradient inline-block"
              >
                {ABOUT_CONTENT.headlineAccent}
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 1.0, duration: reduce ? 0 : 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 lg:mx-0"
            >
              {ABOUT_CONTENT.description}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Gradient divider between dark hero and light sections below */}
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, #3b82f6, transparent)",
        }}
      />

      {/* How I Work */}
      <section className="py-32">
        <SectionHeading
          label="How I Work"
          title="Operating Principles"
        />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="relative border-l border-gray-200 pl-8 ml-4 space-y-12">
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
                <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-blue/40 bg-white">
                  <div className="h-2 w-2 rounded-full bg-accent-blue" />
                </div>
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-bg-secondary/50">
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
                  className="transition-shadow duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.18)]"
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

      {/* Team — shown only when real team members are added */}
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
                  className="glass-card-hover p-6 text-center group"
                >
                  <div
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-violet/10 border border-gray-200 transition-all duration-500 group-hover:border-accent-blue/30"
                    role="img"
                    aria-label={`Avatar for ${m.name}`}
                  >
                    <span className="font-display text-3xl font-bold text-gradient" aria-hidden="true">
                      {m.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{m.name}</h3>
                  <p className="mt-1 text-sm text-accent-blue font-medium">{m.role}</p>
                  <p className="mt-3 text-xs text-text-secondary leading-relaxed">{m.bio}</p>
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
