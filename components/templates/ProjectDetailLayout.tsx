"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
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
      <section className="relative pt-40 pb-16 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -right-40" />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Badge variant="blue">{project.category}</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            {project.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-text-secondary leading-relaxed"
          >
            {project.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-blue px-6 py-3 text-sm font-semibold text-white shadow-glow-blue transition-colors hover:bg-accent-cyan"
            >
              View Live Site
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Gradient preview */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative h-72 md:h-96 rounded-2xl bg-gradient-to-br ${project.gradient} overflow-hidden`}
            role="img"
            aria-label={`${project.name} accent`}
          >
            <div className="absolute inset-0 dot-grid opacity-20" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/40 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {project.metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <p className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
                  {metric.label}
                </p>
                <p className="font-display text-5xl font-bold text-gradient leading-none">
                  {metric.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 bg-bg-secondary/50">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-6">Built With</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="blue">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Notable */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-10"
          >
            <h2 className="font-display text-2xl font-bold mb-4">Notable</h2>
            <p className="text-text-secondary leading-relaxed">
              {project.notable}
            </p>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
