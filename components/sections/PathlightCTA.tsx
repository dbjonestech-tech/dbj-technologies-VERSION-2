import Link from "next/link";
import { PATHLIGHT_CTA_CONTENT } from "@/lib/constants";

export function PathlightCTA() {
  return (
    <section
      aria-labelledby="pathlight-cta-heading"
      className="relative overflow-hidden py-24 sm:py-32"
      style={{ backgroundColor: "#06060a" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 85% 80%, rgba(8,145,178,0.14), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "#9aa3b2" }}
        >
          {PATHLIGHT_CTA_CONTENT.eyebrow}
        </p>
        <h2
          id="pathlight-cta-heading"
          className="mt-4 font-display text-section font-bold leading-tight"
          style={{ color: "#e7ebf2" }}
        >
          <span className="text-gradient">{PATHLIGHT_CTA_CONTENT.heading}</span>
        </h2>
        <p
          className="mx-auto mt-5 max-w-2xl text-xl font-medium sm:text-2xl"
          style={{ color: "#e7ebf2" }}
        >
          {PATHLIGHT_CTA_CONTENT.tagline}
        </p>
        <div className="mt-10">
          <Link
            href={PATHLIGHT_CTA_CONTENT.buttonHref}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
              color: "white",
            }}
          >
            {PATHLIGHT_CTA_CONTENT.buttonLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
