"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  phase: number;
  period: number;
};

type Props = { dimmed?: boolean };

export function StarField({ dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const alphaMultiplier = dimmed ? 0.5 : 1;

    const buildStars = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isMobile = w < 768;
      const count = isMobile ? 45 : 100;
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1 + 0.6,
          baseOpacity: 0.2 + Math.random() * 0.6,
          phase: Math.random() * 6.283,
          period: 3000 + Math.random() * 5000,
        });
      }
      starsRef.current = stars;
    };

    const drawStatic = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const s of starsRef.current) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.baseOpacity * alphaMultiplier})`;
        ctx.fill();
      }
    };

    buildStars();

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lastFrame = 0;
    const FRAME_MS = 1000 / 15;

    const draw = (now: number) => {
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);
        const stars = starsRef.current;
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i]!;
          const t = (now + s.phase * 1000) / s.period;
          const twinkle =
            0.55 + 0.45 * (Math.sin(t * Math.PI * 2) * 0.5 + 0.5);
          const alpha = s.baseOpacity * twinkle * alphaMultiplier;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      buildStars();
      if (prefersReduced) drawStatic();
    };
    window.addEventListener("resize", onResize);

    if (prefersReduced) {
      drawStatic();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener("resize", onResize);
    };
  }, [dimmed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
