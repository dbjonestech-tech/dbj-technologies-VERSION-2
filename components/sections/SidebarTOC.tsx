"use client";

import { useEffect, useState } from "react";
import { accentMap } from "@/lib/page-system/accent-map";
import type { AccentDominance } from "@/lib/page-system/tokens";

interface SidebarTOCProps {
  sections: { id: string; label: string }[];
  accent: AccentDominance;
}

export function SidebarTOC({ sections, accent }: SidebarTOCProps) {
  const a = accentMap[accent];
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce<IntersectionObserverEntry | null>(
          (best, e) =>
            !best || e.boundingClientRect.top < best.boundingClientRect.top
              ? e
              : best,
          null,
        );
        if (topMost) setActive(topMost.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="hidden lg:block sticky top-28 self-start"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted mb-4">
        On this page
      </p>
      <ol className="space-y-2.5 border-l border-text-primary/10 pl-4">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="relative">
              <a
                href={`#${s.id}`}
                className="block text-sm leading-snug transition-colors"
                style={{ color: isActive ? a.hex : undefined }}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-[17px] top-2 h-[2px] w-3"
                    style={{ background: a.hex }}
                  />
                ) : null}
                <span
                  className={
                    isActive
                      ? "font-medium"
                      : "text-text-secondary hover:text-text-primary"
                  }
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
