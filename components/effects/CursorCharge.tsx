"use client";

import { useEffect, useRef } from "react";

/* ─── CONSTANTS & CONFIG ────────────────────────────────────── */
const TIP_OFFSET_X = 1;
const TIP_OFFSET_Y = 3;

// Arc (Lightning) Config
const ARC_LIFE = 150; // ms
const ARC_COUNT_MIN = 3;
const ARC_COUNT_MAX = 5;
const ARC_BASE_LENGTH = 16;
const ARC_SEGMENTS = 4;

// Pulse (Idle) Config
const PULSE_SPEED = 0.005; // Base rotation/pulse speed
const HOVER_MULTIPLIER = 2.5; // Speed multiplier on hover

/* ─── TYPES ─────────────────────────────────────────────────── */
interface Point {
  x: number;
  y: number;
}

interface Arc {
  points: Point[];
  birth: number;
}

export function CursorCharge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // State refs to prevent React re-renders
  const pos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const inText = useRef(false);
  const arcs = useRef<Arc[]>([]);
  const time = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /* ─── HIGH-DPI SCALING ─── */
    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ─── EVENT LISTENERS ─── */
    const isInteractive = (el: HTMLElement) =>
      el.closest("a, button, [role='button'], summary, label, .btn-primary, .btn-outline");
    const isTextEl = (el: HTMLElement) =>
      el.closest("input, textarea, select, [contenteditable='true']");

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX + TIP_OFFSET_X;
      pos.current.y = e.clientY + TIP_OFFSET_Y;
      isVisible.current = true;
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isTextEl(target)) {
        inText.current = true;
        isHovering.current = false;
      } else {
        inText.current = false;
        if (isInteractive(target)) isHovering.current = true;
      }
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !isInteractive(related)) isHovering.current = false;
      if (!related || !isTextEl(related)) inText.current = false;
    };

    const onDown = () => {
      if (inText.current) return;
      const now = performance.now();
      const count = Math.floor(Math.random() * (ARC_COUNT_MAX - ARC_COUNT_MIN + 1)) + ARC_COUNT_MIN;

      for (let i = 0; i < count; i++) {
        // Distribute angles roughly evenly, with some jitter
        const baseAngle = (Math.PI * 2 * (i / count)) + (Math.random() - 0.5) * 0.8;
        const length = ARC_BASE_LENGTH * (0.6 + Math.random() * 0.8);

        // Generate constrained jagged path
        const points: Point[] = [{ x: pos.current.x, y: pos.current.y }];
        let currX = pos.current.x;
        let currY = pos.current.y;
        let currentAngle = baseAngle;

        for (let s = 1; s <= ARC_SEGMENTS; s++) {
          const segLen = length / ARC_SEGMENTS;
          // Sharp angular shifts for static feel
          currentAngle += (Math.random() - 0.5) * 1.2;
          currX += Math.cos(currentAngle) * segLen;
          currY += Math.sin(currentAngle) * segLen;
          points.push({ x: currX, y: currY });
        }
        arcs.current.push({ points, birth: now });
      }
    };

    const onLeaveWindow = () => { isVisible.current = false; };
    const onEnterWindow = () => { isVisible.current = true; };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.addEventListener("mousedown", onDown, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    /* ─── RENDER LOOP ─── */
    const frame = (now: number) => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const { x, y } = pos.current;
      const hoverScale = isHovering.current ? 1 : 0;
      time.current += PULSE_SPEED * (1 + hoverScale * HOVER_MULTIPLIER);
      const t = time.current;

      if (isVisible.current && !inText.current) {
        // 1. Outer Glow (Graphite/Silver mix)
        const glowRadius = 4 + Math.sin(t * 3) * 1 + hoverScale * 2;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, `rgba(200, 200, 220, ${0.4 + hoverScale * 0.3})`);
        gradient.addColorStop(1, "rgba(50, 50, 55, 0)");

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 2. Core Ember (Intense Silver/White)
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + hoverScale * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = isHovering.current ? "rgba(255, 255, 255, 0.95)" : "rgba(180, 180, 190, 0.85)";
        ctx.fill();

        // 3. Orbiting "Energy" specs (Creates the current effect)
        const orbiters = isHovering.current ? 3 : 2;
        for(let i = 0; i < orbiters; i++) {
          const angle = t * 5 + (i * Math.PI * 2 / orbiters);
          const orbitRadius = 2.5 + Math.sin(t * 8 + i) * 1;
          const ox = x + Math.cos(angle) * orbitRadius;
          const oy = y + Math.sin(angle) * orbitRadius;

          ctx.beginPath();
          ctx.arc(ox, oy, 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + hoverScale * 0.4})`;
          ctx.fill();
        }
      }

      /* ─── DRAW ARCS (LIGHTNING) ─── */
      const aliveArcs: Arc[] = [];
      for (let i = 0; i < arcs.current.length; i++) {
        const arc = arcs.current[i];
        const age = now - arc.birth;
        if (age >= ARC_LIFE) continue;
        aliveArcs.push(arc);

        const progress = age / ARC_LIFE;
        // Quadratic fade out (stays bright, fades fast at the end)
        const opacity = 1 - (progress * progress);

        ctx.beginPath();
        ctx.moveTo(arc.points[0].x, arc.points[0].y);
        for (let j = 1; j < arc.points.length; j++) {
          ctx.lineTo(arc.points[j].x, arc.points[j].y);
        }

        ctx.strokeStyle = `rgba(230, 230, 240, ${opacity})`;
        ctx.lineWidth = 1.2 * (1 - progress);
        ctx.lineCap = "round";
        ctx.lineJoin = "miter";
        ctx.stroke();

        // Flash at origin
        if (progress < 0.3) {
            ctx.beginPath();
            ctx.arc(x, y, 2.5 * (1 - progress/0.3), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress/0.3})`;
            ctx.fill();
        }
      }
      arcs.current = aliveArcs;

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    /* ─── CLEANUP ─── */
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
    />
  );
}
