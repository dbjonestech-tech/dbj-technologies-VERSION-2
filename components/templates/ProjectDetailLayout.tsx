"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";
import type { ProjectDetail } from "@/lib/work-data";

interface ProjectDetailLayoutProps {
  project: ProjectDetail;
}

function splitCtaText(text: string): { heading: string; highlight: string } {
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) {
    return { heading: "", highlight: text };
  }
  return {
    heading: words.slice(0, -1).join(" "),
    highlight: words[words.length - 1]!,
  };
}

function resolveCtaButtonText(ctaHref: string): string {
  if (ctaHref === "/pathlight") return "Try Pathlight";
  return "Start a Project";
}

export function ProjectDetailLayout({ project }: ProjectDetailLayoutProps) {
  const { heading: ctaHeading, highlight: ctaHighlight } = splitCtaText(
    project.ctaText
  );
  const ctaButtonText = resolveCtaButtonText(project.ctaHref);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
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
            {project.heroDescription}
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mt-12 aspect-video w-full overflow-hidden rounded-2xl shadow-xl"
          >
            <Image
              src={project.image}
              alt={`${project.name} screenshot`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
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

      {/* Narrative sections */}
      {project.sections.map((section, i) => (
        <section
          key={section.heading}
          className={`py-20 ${i % 2 === 1 ? "bg-bg-secondary/50" : ""}`}
        >
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl font-bold mb-6">
                {section.heading}
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                {section.body}
              </p>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Tech deep dive */}
      <section className="py-20 bg-bg-secondary/50">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-bold mb-12 text-center"
          >
            Built With <span className="text-gradient">— And Why</span>
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {project.techDetails.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6"
              >
                <h3 className="font-display text-lg font-bold text-accent-blue mb-2">
                  {tech.name}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {tech.reason}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline callout */}
      {project.timeline && (
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-gray-200 bg-gray-50 px-10 py-10 text-center"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-accent-blue mb-4">
                Timeline
              </p>
              <p className="text-lg text-text-secondary leading-relaxed">
                {project.timeline}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      <CTASection
        heading={ctaHeading}
        highlight={ctaHighlight}
        buttonText={ctaButtonText}
        buttonHref={project.ctaHref}
      />
    </>
  );
}
