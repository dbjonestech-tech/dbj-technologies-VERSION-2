"use client";

import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";
import { PROJECT_DETAILS } from "@/lib/work-data";
import type { DesignBriefMeta } from "@/lib/design-briefs";

interface WorkContentProps {
  designBriefs: DesignBriefMeta[];
}

export default function WorkContent({ designBriefs }: WorkContentProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <GridBackground />
        <GradientBlob className="-top-40 -right-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-accent-blue/20 bg-accent-blue/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-blue mb-6"
          >
            Portfolio
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            Selected
            <br />
            <span className="text-gradient">Builds.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Each project below is running in production right now, with metrics
            from real users.
          </motion.p>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {PROJECT_DETAILS.map((project, i) => (
              <motion.article
                key={project.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group glass-card-hover overflow-hidden flex flex-col"
              >
                {/* Screenshot (3:2 aspect matches the native viewport
                    screenshot ratio so the full hero is visible without
                    bottom-cropping) */}
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={`${project.name} screenshot`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                  />
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <Badge variant="blue" className="self-start mb-4">
                    {project.category}
                  </Badge>
                  <h2 className="font-display text-2xl font-bold mb-3">
                    {project.name}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* Metrics (stacked on mobile so long values like
                      "Instant + Email" have the full card width to
                      breathe; 3-up only kicks in once each tile has
                      meaningful room) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                    {project.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 text-center"
                      >
                        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                          {m.label}
                        </p>
                        <p className="font-display text-2xl font-bold text-gradient leading-tight break-words">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Notable callout */}
                  <div className="rounded-xl border border-accent-blue/15 bg-accent-blue/5 p-4 mb-8">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-accent-blue mb-2">
                      Notable
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {project.notable}
                    </p>
                  </div>

                  {/* Two links */}
                  <div className="mt-auto flex items-center gap-6 pt-2">
                    <Link
                      href={`/work/${project.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-accent-blue transition-colors hover:text-accent-cyan min-h-[44px]"
                    >
                      View Case Study
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">: {project.name}</span>
                    </Link>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors min-h-[44px]"
                    >
                      Live Site
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Design Briefs */}
      <section className="relative py-24 border-t border-text-primary/10 overflow-hidden">
        <GradientBlob className="-top-20 -left-40 opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block rounded-full border border-accent-cyan/25 bg-accent-cyan/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent-cyan mb-6"
            >
              Design Briefs
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-display text-[clamp(2rem,3.6vw,2.8rem)] font-bold leading-tight tracking-tight"
            >
              Reference{" "}
              <span className="text-gradient">architectures.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-5 text-text-secondary leading-relaxed"
            >
              Design briefs covering a selection of verticals I work in. Each
              one digs into what the category actually needs online: how the
              customer chooses, what most sites get wrong, and the surfaces
              that turn a search into a booking.
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {designBriefs.map((brief, i) => (
              <motion.article
                key={brief.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group glass-card-hover overflow-hidden flex flex-col"
              >
                {/* Preview (intentionally not a tap target on mobile;
                    only the explicit "Read the Design Brief" CTA below
                    is the link, matching the project cards above. 3:2
                    aspect matches the native 3024x1964 screenshot ratio
                    so the full template hero is visible at any width.) */}
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={brief.preview}
                    alt={`${brief.vertical} reference architecture preview`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                  />
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <span
                    className="inline-flex items-center self-start gap-2 rounded-full border px-3 py-1 mb-4 font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      borderColor: `${brief.paletteAccent}40`,
                      backgroundColor: `${brief.paletteAccent}0F`,
                      color: brief.paletteAccent,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: brief.paletteAccent }}
                      aria-hidden="true"
                    />
                    {brief.vertical}
                  </span>

                  <h3 className="font-display text-2xl font-bold mb-3 leading-tight">
                    {brief.headline}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    {brief.description}
                  </p>

                  {/* Key surfaces (parallel to project metrics; same
                      mobile-stack pattern so long surface labels like
                      "Society Membership" or "Signed Fiduciary Pledge"
                      have full card width on phones) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
                    {brief.keySurfaces.map((surface) => (
                      <div
                        key={surface}
                        className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 text-center"
                      >
                        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                          Surface
                        </p>
                        <p className="font-display text-[13px] font-bold text-text-primary leading-tight break-words">
                          {surface}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Brief callout */}
                  <div
                    className="rounded-xl border p-4 mb-8"
                    style={{
                      borderColor: `${brief.paletteAccent}26`,
                      backgroundColor: `${brief.paletteAccent}0A`,
                    }}
                  >
                    <p
                      className="text-[10px] font-mono uppercase tracking-widest mb-2"
                      style={{ color: brief.paletteAccent }}
                    >
                      In the Brief
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {brief.summary}
                    </p>
                  </div>

                  {/* Single CTA */}
                  <div className="mt-auto flex items-center gap-6 pt-2">
                    <Link
                      href={`/work/design-briefs/${brief.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-accent-blue transition-colors hover:text-accent-cyan min-h-[44px]"
                    >
                      Read the Design Brief
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">: {brief.vertical}</span>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        heading="Let's Build"
        highlight="Yours."
        description="Tell me about your project and I'll show you what's possible."
        buttonText="Start a Project"
        buttonHref="/contact"
      />
    </>
  );
}
