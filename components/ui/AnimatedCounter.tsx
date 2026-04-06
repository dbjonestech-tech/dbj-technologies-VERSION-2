"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  suffix = "",
  label,
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(value); // Start at real value to avoid hydration flash

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;
    // Reset to 0 and animate up only after in-view
    setCount(0);
    let start = 0;
    const increment = value / (duration * 60);
    const isDecimal = value % 1 !== 0;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? Math.round(start * 10) / 10 : Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [inView, value, duration, prefersReducedMotion]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="font-display text-5xl font-bold text-gradient md:text-6xl min-h-[3.5rem] md:min-h-[4rem]">
        {count}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-medium uppercase tracking-widest text-text-secondary">
        {label}
      </div>
    </motion.div>
  );
}
