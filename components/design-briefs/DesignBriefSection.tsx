"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";

interface DesignBriefSectionProps {
  accent: string;
  index: number;
  total: number;
  heading: string;
  paragraphs: string[];
  image?: { src: string; alt: string };
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

export function DesignBriefSection({
  accent,
  index,
  total,
  heading,
  paragraphs,
  image,
}: DesignBriefSectionProps) {
  const reduced = useReducedMotion();

  const tag: Variants = {
    hidden: reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  const ruler: Variants = {
    hidden: reduced ? { scaleX: 1 } : { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: reduced ? 0 : 1.1, ease: EASE_OUT, delay: 0.1 },
    },
  };

  const headingV: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.7, ease: EASE_OUT, delay: 0.15 },
    },
  };

  const imageV: Variants = {
    hidden: reduced
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 36, scale: 0.985 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: reduced ? 0 : 1.0, ease: EASE_OUT, delay: 0.2 },
    },
  };

  const halo: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.28,
      transition: { duration: reduced ? 0 : 1.4, ease: EASE_OUT, delay: 0.35 },
    },
  };

  const proseStagger: Variants = {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.4 },
    },
  };

  const proseItem: Variants = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  const sectionId = `section-${index + 1}`;

  return (
    <motion.article
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
      className="mb-28 lg:mb-40 last:mb-0 scroll-mt-24"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {/* Technical chapter break: mono-caps tag + animated ruler */}
      <div className="flex items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
        <motion.div
          variants={tag}
          className="flex items-center gap-2.5 shrink-0"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Surface
          </span>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted/60">
            / {String(total).padStart(2, "0")}
          </span>
        </motion.div>
        <motion.span
          variants={ruler}
          className="h-[2px] flex-1 origin-left"
          style={{
            background: `linear-gradient(90deg, ${accent} 0%, ${accent}11 100%)`,
          }}
          aria-hidden="true"
        />
      </div>

      <motion.h2
        id={`${sectionId}-heading`}
        variants={headingV}
        className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-[1.1] tracking-tight mb-12 lg:mb-16 max-w-4xl"
      >
        {heading}
      </motion.h2>

      {image ? (
        <motion.div
          variants={imageV}
          className="relative mb-14 lg:mb-20"
        >
          <motion.div
            variants={halo}
            className="absolute -inset-4 lg:-inset-8 -z-10 blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <div
            className="relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 transform-gpu"
            style={{
              borderColor: `${accent}44`,
              boxShadow: `0 40px 100px -30px ${accent}44, 0 20px 40px -15px rgba(0,0,0,0.18)`,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={1600}
              height={1000}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 1400px"
            />
          </div>
        </motion.div>
      ) : null}

      <motion.div
        variants={proseStagger}
        className="mx-auto max-w-3xl space-y-6 lg:space-y-7"
      >
        {paragraphs.map((para, j) => (
          <motion.p
            key={j}
            variants={proseItem}
            className="text-[1.0625rem] lg:text-[1.125rem] leading-[1.85] text-text-secondary"
          >
            {para}
          </motion.p>
        ))}
      </motion.div>
    </motion.article>
  );
}
