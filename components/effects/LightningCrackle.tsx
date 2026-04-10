"use client";

import { useEffect, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

interface LightningCrackleProps {
  scrollYProgress: MotionValue<number>;
  peakScroll: number;
  dissipateScroll: number;
}

type Point = { x: number; y: number };

/** Recursive midpoint displacement — returns a jagged polyline between two points. */
function displace(
  start: Point,
  end: Point,
  displacement: number,
  detail: number
): Point[] {
  if (detail <= 0) return [start, end];
  const mid: Point = {
    x: (start.x + end.x) / 2 + (Math.random() - 0.5) * displacement,
    y: (start.y + end.y) / 2 + (Math.random() - 0.5) * displacement,
  };
  const left = displace(start, mid, displacement / 2, detail - 1);
  const right = displace(mid, end, displacement / 2, detail - 1);
  return [...left.slice(0, -1), ...right];
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  displacement: number,
  detail: number,
  branchChance: number
) {
  const points = displace(start, end, displacement, detail);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Branches off midpoints
  for (let i = 1; i < points.length - 1; i++) {
    if (Math.random() < branchChance) {
      const p = points[i];
      const angle = Math.random() * Math.PI * 2;
      const len = displacement * (0.4 + Math.random() * 0.6);
      const branchEnd: Point = {
        x: p.x + Math.cos(angle) * len,
        y: p.y + Math.sin(angle) * len,
      };
      drawBolt(ctx, p, branchEnd, displacement / 2, detail - 1, 0);
    }
  }
}

export function LightningCrackle({
  scrollYProgress,
  peakScroll,
  dissipateScroll,
}: LightningCrackleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const opacity = useTransform(
    scrollYProgress,
    [0, peakScroll, dissipateScroll],
    [0.8, 1, 0]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("resize", resize);

    const tick = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Trailing phosphor fade
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, w, h);

      if (Math.random() > 0.4) {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#4facfe";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Pick two random points along the bounding-box edges
        const edges = [
          (): Point => ({ x: Math.random() * w, y: 0 }),
          (): Point => ({ x: w, y: Math.random() * h }),
          (): Point => ({ x: Math.random() * w, y: h }),
          (): Point => ({ x: 0, y: Math.random() * h }),
        ];
        const startEdge = Math.floor(Math.random() * 4);
        let endEdge = Math.floor(Math.random() * 4);
        if (endEdge === startEdge) endEdge = (endEdge + 2) % 4;
        const start = edges[startEdge]();
        const end = edges[endEdge]();

        const displacement = Math.min(w, h) * 0.25;
        drawBolt(ctx, start, end, displacement, 5, 0.35);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      style={{ opacity }}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 mix-blend-screen"
      aria-hidden="true"
    />
  );
}

export default LightningCrackle;
