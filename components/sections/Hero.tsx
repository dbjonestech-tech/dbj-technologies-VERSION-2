"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { Spotlight } from "@/components/effects/Spotlight";
import { MagneticButton } from "@/components/effects/MagneticButton";

/* Heavy canvas component — load after first paint */
const ParticleField = dynamic(
  () => import("@/components/effects/ParticleField").then((m) => m.ParticleField),
  { ssr: false }
);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const parallax1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const parallax2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const parallax3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const parallax4 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={sectionRef} className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Morphing gradient mesh background */}
      <div className="absolute inset-0 z-0">
        <div className="gradient-mesh-bg absolute inset-0 opacity-30">
          <span className="gradient-mesh-layer" />
        </div>
        <div className="absolute inset-0 bg-bg-primary/40" />
      </div>

      {/* Background layers */}
      <ParticleField />
      <Spotlight />
      <GradientBlob className="-top-40 -left-40" colors={["#3b82f6", "#1e40af", "#06b6d4"]} />
      <GradientBlob className="-bottom-40 -right-40" colors={["#8b5cf6", "#6d28d9", "#3b82f6"]} />

      {/* Floating geometric shapes with scroll parallax */}
      <motion.div
        className="absolute top-1/4 right-[15%] h-20 w-20 border border-accent-blue/20 rounded-xl"
        animate={{ rotate: 360, y: [-10, 10, -10] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 6, repeat: Infinity } }}
        aria-hidden="true"
        style={{ perspective: "800px", translateY: parallax1 }}
      />
      <motion.div
        className="absolute bottom-1/3 left-[10%] h-16 w-16 border border-accent-cyan/15 rounded-full"
        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity } }}
        aria-hidden="true"
        style={{ translateY: parallax2 }}
      />
      <motion.div
        className="absolute top-[40%] left-[20%] h-2 w-2 rounded-full bg-accent-violet/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
        aria-hidden="true"
        style={{ translateY: parallax3 }}
      />
      <motion.div
        className="absolute top-[30%] right-[25%] h-3 w-3 rounded-full bg-accent-blue/30"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        aria-hidden="true"
        style={{ translateY: parallax4 }}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-6xl px-6 text-center lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/5 px-5 py-2 text-xs font-mono uppercase tracking-widest text-accent-blue backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse-glow" />
            Accepting New Projects
          </span>
        </motion.div>

        {/* Heading */}
        <div className="mt-8">
          <motion.h1
            className="font-display text-hero font-bold leading-tight tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {["We", "Build", "the"].map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-3 mr-[0.25em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + i * 0.1,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden pb-4">
              <motion.span
                className="inline-block text-gradient"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.6,
                  ease: [0.33, 1, 0.68, 1],
                }}
              >
                Future.
              </motion.span>
            </span>
          </motion.h1>
        </div>

        {/* Subheading */}
        <motion.p
          className="mx-auto mt-8 max-w-2xl text-hero-sub leading-relaxed text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          High-performance websites, scalable applications, and cloud infrastructure — built by senior engineers in Dallas, TX.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Link href="/contact">
            <MagneticButton className="btn-primary text-base" strength={0.2}>
              Start Your Project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </MagneticButton>
          </Link>
          <Link href="/work">
            <MagneticButton className="btn-outline text-base group" strength={0.2}>
              View Our Work
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Tech ticker */}
        <motion.div
          className="mt-16 flex items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <span>React</span>
          <span className="h-1 w-1 rounded-full bg-text-muted" />
          <span>Next.js</span>
          <span className="h-1 w-1 rounded-full bg-text-muted" />
          <span>TypeScript</span>
          <span className="h-1 w-1 rounded-full bg-text-muted" />
          <span>Node.js</span>
          <span className="h-1 w-1 rounded-full bg-text-muted hidden sm:block" />
          <span className="hidden sm:block">AWS</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Scroll
          </span>
          <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary/80 to-transparent z-10" />
    </section>
  );
}
