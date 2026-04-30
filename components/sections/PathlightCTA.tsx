import Image from "next/image";
import Link from "next/link";
import { PATHLIGHT_CTA_CONTENT } from "@/lib/constants";
import { PathlightLogo } from "@/components/brand/PathlightLogo";

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
        <div className="mx-auto mb-6 flex justify-center">
          <PathlightLogo
            size={140}
            className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px]"
            alt="Pathlight"
          />
        </div>
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

      {/* Browser-frame product mockup of the Pathlight scan form. The
          chrome bar uses absolute positioning for the URL pill so the
          pill remains centered regardless of the dots' width, while the
          dots stay above it via z-10. The aspect ratio is locked by the
          Image component's intrinsic width/height; w-full + h-auto on
          the Image makes it responsive within the framed container. */}
      <div className="relative mx-auto mt-12 max-w-5xl px-4 sm:mt-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-cyan-500/10">
          <div className="relative flex h-9 items-center border-b border-white/5 bg-slate-800/80 px-4">
            <div className="z-10 flex gap-1.5">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#FF5F57" }}
              />
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#FEBC2E" }}
              />
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#28C840" }}
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 hidden justify-center sm:flex"
            >
              <div className="rounded-full bg-white/5 px-4 py-1 text-xs text-white/40">
                dbjtechnologies.com/pathlight
              </div>
            </div>
          </div>
          <Image
            src="/images/pathlight-landing.webp"
            alt="Pathlight website audit tool - scan form"
            width={2400}
            height={1559}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
            quality={85}
            className="block h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
