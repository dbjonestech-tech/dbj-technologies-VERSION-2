"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";

function Star({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.286 3.96c.299.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.96a1 1 0 00-.364-1.118L2.46 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z" />
    </svg>
  );
}

export function TestimonialBand() {
  const t = TESTIMONIALS[0];
  if (!t) return null;
  const filled = Math.max(0, Math.min(5, Math.round(t.rating)));

  return (
    <section
      aria-label="Client testimonial"
      className="relative px-6 py-16 print-hidden md:py-20"
    >
      <div className="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-accent-blue/25 to-transparent" />

      <motion.figure
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto mt-10 max-w-2xl text-center"
      >
        <div className="flex items-center justify-center gap-1.5 text-amber-400">
          <span className="sr-only">{filled} out of 5 stars</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={i < filled ? "h-4 w-4" : "h-4 w-4 opacity-20"}
            />
          ))}
        </div>

        <blockquote className="mt-5">
          <p className="font-display text-lg font-medium leading-snug text-text-primary md:text-xl">
            &ldquo;{t.quote}&rdquo;
          </p>
        </blockquote>

        <figcaption className="mt-6 space-y-1.5">
          <p className="text-sm font-semibold text-text-primary">
            {t.name}, {t.title}
            <span aria-hidden="true" className="mx-2 text-text-muted/60">
              ·
            </span>
            {t.business}
            <span aria-hidden="true" className="mx-2 text-text-muted/60">
              ·
            </span>
            {t.location}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.7rem] text-text-muted">
            <span className="font-mono uppercase tracking-[0.2em]">
              {t.source} Review
            </span>
            <span aria-hidden="true">·</span>
            <a
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent-cyan transition-colors hover:text-accent-blue"
            >
              View live site
              <span aria-hidden="true">&rarr;</span>
            </a>
          </p>
        </figcaption>
      </motion.figure>

      <div className="mx-auto mt-10 h-px max-w-3xl bg-gradient-to-r from-transparent via-accent-blue/25 to-transparent" />
    </section>
  );
}
