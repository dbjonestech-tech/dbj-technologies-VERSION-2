"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

interface StatCalloutProps {
  value: string;
  label: string;
  source: { name: string; url?: string };
  accent: AccentDominance;
  variant?: "hero" | "break";
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function StatCallout({
  value,
  label,
  source,
  accent,
  variant = "break",
}: StatCalloutProps) {
  const reduced = useReducedMotion();
  const a = accentMap[accent];
  const isHero = variant === "hero";

  const v: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.7, ease: EASE_OUT },
    },
  };

  return (
    <motion.figure
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={v}
      className={isHero ? "relative" : "my-14 lg:my-20"}
    >
      <div
        className={`relative rounded-2xl border text-center ${
          isHero ? "p-10 lg:p-14" : "p-8 lg:p-10"
        }`}
        style={{
          borderColor: `${a.hex}33`,
          background: `linear-gradient(180deg, ${a.hex}0d 0%, transparent 100%)`,
          boxShadow: `0 30px 80px -30px ${a.hex}33`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -inset-2 -z-10 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${a.hex}1a 0%, transparent 60%)`,
          }}
        />
        <div
          className={`font-display font-bold tracking-tight leading-none ${
            isHero
              ? "text-[clamp(3.4rem,8vw,6rem)]"
              : "text-[clamp(2.4rem,5vw,3.6rem)]"
          }`}
          style={{ color: a.hex }}
        >
          {value}
        </div>
        <div
          className={`mx-auto mt-4 max-w-xl text-text-secondary leading-snug ${
            isHero ? "text-lg lg:text-xl" : "text-base lg:text-lg"
          }`}
        >
          {label}
        </div>
        <figcaption className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          Source:{" "}
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-4 hover:text-text-primary transition-colors"
            >
              {source.name}
            </a>
          ) : (
            source.name
          )}
        </figcaption>
      </div>
    </motion.figure>
  );
}
