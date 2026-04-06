"use client";

import { STATS } from "@/lib/constants";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export function StatsSection() {
  return (
    <section className="relative py-20 border-y border-gray-200">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-secondary to-bg-primary" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <AnimatedCounter
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
