import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DIAGNOSE_FIX_GROW } from "@/lib/constants";

export function DiagnoseFixGrow() {
  return (
    <section
      aria-labelledby="diagnose-fix-grow-heading"
      className="relative py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 15% 15%, #3b82f6 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 85%, #0891b2 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
            {DIAGNOSE_FIX_GROW.eyebrow}
          </p>
          <h2
            id="diagnose-fix-grow-heading"
            className="mt-4 font-display text-section font-bold leading-tight text-text-primary"
          >
            {DIAGNOSE_FIX_GROW.headlineLead}{" "}
            <span className="text-gradient">
              {DIAGNOSE_FIX_GROW.headlineAccent}
            </span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 sm:mt-16">
          {DIAGNOSE_FIX_GROW.steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-text-primary/10 bg-bg-primary p-7 sm:p-8 transition-shadow hover:shadow-md"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -12px rgba(59,130,246,0.12)",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-semibold text-accent-blue">
                  {step.number}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                  {step.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-[15px]">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <Link
            href={DIAGNOSE_FIX_GROW.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
              boxShadow: "0 6px 20px rgba(59,130,246,0.25)",
            }}
          >
            {DIAGNOSE_FIX_GROW.primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={DIAGNOSE_FIX_GROW.secondaryCta.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary transition-colors hover:text-accent-blue"
          >
            {DIAGNOSE_FIX_GROW.secondaryCta.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
