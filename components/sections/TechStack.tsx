"use client";

import { motion } from "framer-motion";
import { TECH_STACK } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function TechStackSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <SectionHeading
        label="Tech Stack"
        title="Modern Tools, Proven Results"
        description="I use industry-leading technologies to build systems that are fast, secure, and built to scale."
      />

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative flex flex-wrap items-center justify-center gap-4">
          {TECH_STACK.map((tech, i) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.1, y: -4 }}
              className="glass-card px-6 py-3 cursor-default group"
            >
              <span className="font-mono text-sm text-text-secondary group-hover:text-gray-900 transition-colors duration-300">
                {tech}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-accent-blue/5 blur-[100px] pointer-events-none" />
      </div>
    </section>
  );
}
