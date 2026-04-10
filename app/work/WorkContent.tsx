"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientBlob } from "@/components/effects/GradientBlob";
import { CTASection } from "@/components/sections/CTA";
import { Badge } from "@/components/ui/Badge";
import { PROJECT_DETAILS } from "@/lib/work-data";

const categories = [
  "All",
  ...Array.from(new Set(PROJECT_DETAILS.map((p) => p.category))),
];

export default function WorkContent() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? PROJECT_DETAILS
      : PROJECT_DETAILS.filter((p) => p.category === active);

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
            Core Disciplines
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-section font-bold leading-tight"
          >
            How I
            <br />
            <span className="text-gradient">Engineer.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Three core engineering disciplines that define my practice. Each
            represents a deep area of expertise with a rigorous, repeatable
            process applied to every engagement.
          </motion.p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                  active === cat
                    ? "bg-accent-blue text-white shadow-glow-blue"
                    : "border border-gray-200 bg-white text-text-secondary hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Grid */}
          <motion.div
            layout
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.div
                  key={project.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="glass-card-hover overflow-hidden group block cursor-default">
                    {/* Gradient placeholder image */}
                    <div
                      className={`relative h-56 bg-gradient-to-br ${project.gradient} overflow-hidden`}
                      role="img"
                      aria-label={`${project.title} project preview`}
                    >
                      {/* Decorative pattern */}
                      <div
                        className="absolute inset-0 dot-grid opacity-20"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-mono uppercase tracking-widest text-accent-blue">
                          {project.category}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-text-muted">
                          <Info className="h-3 w-3" aria-hidden="true" />{" "}
                          {project.typeLabel}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold mb-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                      <Link
                        href={`/work/${project.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-accent-blue min-h-[44px] min-w-[44px]"
                      >
                        View Project
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <CTASection
        heading="Like What You See?"
        highlight="Let's Build Yours."
        description="These disciplines define my engineering practice. Your engagement gets the same architectural rigor, applied to your specific goals."
        buttonText="Discuss Your Project"
      />
    </>
  );
}
