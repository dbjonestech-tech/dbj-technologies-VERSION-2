"use client";

import { useState, useCallback, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { Spotlight } from "@/components/effects/Spotlight";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { HERO_CONTENT } from "@/lib/constants";
import HeroCinema from "./HeroCinema";

const ParticleField = dynamic(
  () =>
    import("@/components/effects/ParticleField").then((m) => m.ParticleField),
  { ssr: false }
);

type Mode = "cinematic" | "skip" | "fade";

export function Hero() {
  const [lightRevealed, setLightRevealed] = useState(false);
  const [mode, setMode] = useState<Mode>("cinematic");

  /* ─── SKIP DETECTION (runs before paint) ─── */
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) {
      setMode("skip");
      setLightRevealed(true);
      return;
    }
    try {
      if (sessionStorage.getItem("hero-revealed") === "true") {
        setMode("fade");
        setLightRevealed(true);
      }
    } catch {
      /* sessionStorage blocked (private browsing) */
    }
  }, []);

  const handleRevealComplete = useCallback(() => setLightRevealed(true), []);

  /* ─── DERIVED STATE ─── */
  const getDelay = (cinematicDelay: number) => {
    if (mode === "skip" || mode === "fade") return 0;
    return cinematicDelay;
  };

  const getDuration = () => {
    if (mode === "skip") return 0;
    if (mode === "fade") return 0.6;
    return 0.5;
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ════ LIGHT HERO (z-0 to z-20) ════ */}

      {/* Morphing gradient mesh background */}
      <div className="absolute inset-0 z-0">
        <div className="gradient-mesh-bg absolute inset-0 opacity-30">
          <span className="gradient-mesh-layer" />
        </div>
        <div className="absolute inset-0 bg-bg-primary/40" />
      </div>

      <ParticleField />
      <Spotlight />
      <GradientBlob
        className="-top-40 -left-40"
        colors={["#3b82f6", "#1e40af", "#06b6d4"]}
      />
      <GradientBlob
        className="-bottom-40 -right-40"
        colors={["#8b5cf6", "#6d28d9", "#3b82f6"]}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-6xl px-6 text-center lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={
            lightRevealed
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.9 }
          }
          transition={{ duration: getDuration(), delay: getDelay(0.2) }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/5 px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-accent-blue backdrop-blur-sm sm:px-5 sm:py-2 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse-glow" />
            {HERO_CONTENT.badge}
          </span>
        </motion.div>

        {/* Heading */}
        <div className="mt-6 sm:mt-8">
          <motion.h1
            className="font-display text-hero font-extrabold leading-tight tracking-tighter text-slate-900"
            initial={{ opacity: 0 }}
            animate={lightRevealed ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: mode === "skip" ? 0 : 0.3 }}
          >
            {HERO_CONTENT.headlineWords.map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden pb-2 mr-[0.2em] sm:pb-3 sm:mr-[0.25em]"
              >
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={lightRevealed ? { y: 0 } : { y: "110%" }}
                  transition={{
                    duration: mode === "skip" ? 0 : 0.8,
                    delay: mode === "cinematic" ? 0.1 * i : 0,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden pb-2 sm:pb-4">
              <motion.span
                className="inline-block text-gradient"
                initial={{ y: "110%" }}
                animate={lightRevealed ? { y: 0 } : { y: "110%" }}
                transition={{
                  duration: mode === "skip" ? 0 : 0.8,
                  delay: mode === "cinematic" ? 0.15 : 0,
                  ease: [0.33, 1, 0.68, 1],
                }}
              >
                {HERO_CONTENT.headlineAccent.replace(".", "")}
                <span className="animate-pulse">.</span>
              </motion.span>
            </span>
          </motion.h1>
        </div>

        {/* Subheading */}
        <motion.p
          className="mx-auto mt-5 max-w-2xl text-hero-sub leading-relaxed text-text-secondary sm:mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={
            lightRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: getDuration(), delay: getDelay(0.3) }}
        >
          {HERO_CONTENT.subheading}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={
            lightRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: getDuration(), delay: getDelay(0.4) }}
        >
          <Link href={HERO_CONTENT.primaryCta.href}>
            <MagneticButton className="btn-primary text-base" strength={0.2}>
              {HERO_CONTENT.primaryCta.label}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </MagneticButton>
          </Link>
          <Link href={HERO_CONTENT.secondaryCta.href}>
            <MagneticButton
              className="btn-outline text-base group"
              strength={0.2}
            >
              {HERO_CONTENT.secondaryCta.label}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Tech ticker */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-text-muted sm:mt-16 sm:gap-6 sm:text-xs"
          initial={{ opacity: 0 }}
          animate={lightRevealed ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: getDuration(), delay: getDelay(0.5) }}
        >
          {HERO_CONTENT.techTicker.map((tech, i) => (
            <span key={tech}>
              {i > 0 && (
                <span
                  className={`inline-block h-1 w-1 rounded-full bg-text-muted mr-4 sm:mr-6${
                    i >= 4 ? " hidden sm:inline-block" : ""
                  }`}
                />
              )}
              <span className={i >= 4 ? "hidden sm:inline" : ""}>
                {tech}
              </span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={lightRevealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: getDelay(0.6), duration: getDuration() }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Scroll
          </span>
          <ChevronDown
            className="h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary/80 to-transparent z-10" />

      {/* ════ CINEMATIC LAYER (deferred, no SSR) ════ */}
      <HeroCinema onRevealComplete={handleRevealComplete} />
    </section>
  );
}
