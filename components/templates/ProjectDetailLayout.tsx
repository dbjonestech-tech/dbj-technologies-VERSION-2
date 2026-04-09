"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";
import type { ProjectDetail } from "@/lib/work-data";

interface ProjectDetailLayoutProps {
  project: ProjectDetail;
}

export function ProjectDetailLayout({ project }: ProjectDetailLayoutProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -right-40" />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to All Work
            </Link>
          </motion.div>

          {/* Type badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3"
          >
            <span className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue">
              {project.category}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-600">
              <Info className="h-3 w-3" aria-hidden="true" />
              {project.typeLabel}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            {project.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-text-secondary leading-relaxed"
          >
            {project.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {project.tags.map((tag) => (
              <Badge key={tag} variant="blue">{tag}</Badge>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gradient preview image */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative h-72 md:h-96 rounded-2xl bg-gradient-to-br ${project.gradient} overflow-hidden`}
            role="img"
            aria-label={`${project.title} project preview`}
          >
            <div className="absolute inset-0 dot-grid opacity-20" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/40 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-text-secondary leading-relaxed"
          >
            {project.longDescription}
          </motion.p>
        </div>
      </section>

      {/* Challenge & Solution */}
      <section className="py-20 bg-bg-secondary/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <h2 className="font-display text-2xl font-bold mb-4">The Challenge</h2>
              <p className="text-text-secondary leading-relaxed">{project.challenge}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8"
            >
              <h2 className="font-display text-2xl font-bold mb-4">The Solution</h2>
              <p className="text-text-secondary leading-relaxed">{project.solution}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results */}
      {project.results.length > 0 && (
        <section className="py-20">
          <SectionHeading label="Results" title="By the Numbers" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {project.results.map((result, i) => (
                <motion.div
                  key={result.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 text-center"
                >
                  <div className="font-display text-4xl font-bold text-gradient mb-2">
                    {result.value}
                  </div>
                  <p className="text-sm text-text-secondary">{result.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 bg-bg-secondary/50">
        <SectionHeading label="Key Features" title="What I Built" />
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="space-y-3">
            {project.features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-cyan" aria-hidden="true" />
                <span className="text-text-secondary">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
