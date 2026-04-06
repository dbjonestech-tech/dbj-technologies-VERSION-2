"use client";

import { CLIENT_LOGOS } from "@/lib/constants";
import { useEffect, useRef, useState } from "react";

export function ClientLogos() {
  if (CLIENT_LOGOS.length === 0) return null;
  const doubled = [...CLIENT_LOGOS, ...CLIENT_LOGOS];
  const labelRef = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative min-h-[200px] py-20 overflow-hidden border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p
          ref={labelRef}
          className={`text-center text-xs font-mono uppercase tracking-[0.2em] text-text-muted mb-10 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          Trusted by forward-thinking companies
        </p>
      </div>

      {/* Marquee rows */}
      <div className="relative flex flex-col gap-4">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10" />

        {/* Row 1 — scrolls left */}
        <div className="flex animate-marquee">
          {doubled.map((name, i) => (
            <div
              key={i}
              className="mx-8 flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-4 min-h-[60px] min-w-[160px] shadow-sm transition-all duration-500 hover:border-gray-300 hover:shadow-md group"
            >
              <span className="font-display text-lg font-bold text-text-muted transition-colors duration-500 group-hover:text-gray-900 whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Row 2 — scrolls right (reverse) */}
        <div className="flex animate-marquee-reverse">
          {doubled.map((name, i) => (
            <div
              key={`rev-${i}`}
              className="mx-8 flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-4 min-h-[60px] min-w-[160px] shadow-sm transition-all duration-500 hover:border-gray-300 hover:shadow-md group"
            >
              <span className="font-display text-lg font-bold text-text-muted transition-colors duration-500 group-hover:text-gray-900 whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
