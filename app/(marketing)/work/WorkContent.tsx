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

export default function WorkContent() {
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
            Selected Work
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            What I&apos;ve
            <br />
            <span className="text-gradient">Built.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Live production systems. Real metrics. Every project below is
            running in production right now.
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
                {/* Screenshot */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={`${project.name} screenshot`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
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

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {project.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 text-center"
                      >
                        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                          {m.label}
                        </p>
                        <p className="font-display text-2xl font-bold text-gradient leading-none">
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
