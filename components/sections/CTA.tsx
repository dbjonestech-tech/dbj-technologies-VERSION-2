"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { CTA_DEFAULTS } from "@/lib/constants";

interface CTAProps {
  heading?: string;
  highlight?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function CTASection({
  heading = CTA_DEFAULTS.heading,
  highlight = CTA_DEFAULTS.highlight,
  description = CTA_DEFAULTS.description,
  buttonText = CTA_DEFAULTS.buttonText,
  buttonHref = "/contact",
}: CTAProps) {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-bg-primary to-accent-violet/10" />
      <div className="absolute inset-0 dot-grid opacity-20" />

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-accent-blue/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-accent-violet/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-section font-bold leading-tight"
        >
          {heading}
          <br />
          <span className="text-gradient">{highlight}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
        >
          {description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <Link href={buttonHref}>
            <MagneticButton className="btn-primary text-base" strength={0.2}>
              {buttonText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MagneticButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
