"use client";

import { useEffect, useRef } from "react";

/* ─── CONSTANTS & CONFIG ────────────────────────────────────── */

// Hover (Coil) Config
const HOVER_ARC_LENGTH = 8;
const HOVER_ARC_SEGMENTS = 4;
const HOVER_ARC_LIFE = 150;

// Click (Discharge) Config
const CLICK_ARC_COUNT_MIN = 6;
const CLICK_ARC_COUNT_MAX = 10;
const CLICK_ARC_LENGTH = 30;
const CLICK_ARC_SEGMENTS = 6;
const CLICK_ARC_LIFE = 250;

/* ─── TYPES ─────────────────────────────────────────────────── */
interface Point {
  x: number;
  y: number;
}

interface Arc {
  points: Point[];
  birth: number;
  life: number;
}

function spawnArc(
  cx: number,
  cy: number,
  angle: number,
  length: number,
  segments: number,
  jitter: number,
  life: number,
  now: number
): Arc {
  const points: Point[] = [{ x: cx, y: cy }];
  let x = cx;
  let y = cy;
  let a = angle;

  for (let s = 1; s <= segments; s++) {
    const segLen = length / segments;
    a += (Math.random() - 0.5) * jitter;
    x += Math.cos(a) * segLen;
    y += Math.sin(a) * segLen;
    points.push({ x, y });
  }

  return { points, birth: now, life };
}

export function CursorCharge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const pos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const inText = useRef(false);
  const arcs = useRef<Arc[]>([]);

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
      el.closest(
        "a, button, [role='button'], summary, label, .btn-primary, .btn-outline"
      );
    const isTextEl = (el: HTMLElement) =>
      el.closest("input, textarea, select, [contenteditable='true']");

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
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

    /* ─── CLICK: DISCHARGE (360-degree explosion) ─── */
    const onDown = () => {
      if (inText.current) return;
      const now = performance.now();
      const count =
        Math.floor(
          Math.random() * (CLICK_ARC_COUNT_MAX - CLICK_ARC_COUNT_MIN + 1)
        ) + CLICK_ARC_COUNT_MIN;

      for (let i = 0; i < count; i++) {
        const baseAngle =
          (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
        const length = CLICK_ARC_LENGTH * (0.7 + Math.random() * 0.6);
        arcs.current.push(
          spawnArc(
            pos.current.x,
            pos.current.y,
            baseAngle,
            length,
            CLICK_ARC_SEGMENTS,
            2.8, // high jitter for jagged look
            CLICK_ARC_LIFE,
            now
          )
        );
      }
    };

    const onLeaveWindow = () => {
      isVisible.current = false;
    };
    const onEnterWindow = () => {
      isVisible.current = true;
    };

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

      ctx.globalCompositeOperation = "screen";

      /* ─── HOVER: COIL (tight static at cursor tip) ─── */
      if (isVisible.current && !inText.current && isHovering.current) {
        const hoverCount = 1 + Math.floor(Math.random() * 2); // 1-2 arcs
        for (let i = 0; i < hoverCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const length =
            HOVER_ARC_LENGTH * (0.6 + Math.random() * 0.8);
          arcs.current.push(
            spawnArc(
              x,
              y,
              angle,
              length,
              HOVER_ARC_SEGMENTS,
              3.0, // tight jitter
              HOVER_ARC_LIFE,
              now
            )
          );
        }
      }

      /* ─── DRAW ALL ARCS ─── */
      const aliveArcs: Arc[] = [];
      for (let i = 0; i < arcs.current.length; i++) {
        const arc = arcs.current[i];
        const age = now - arc.birth;
        if (age >= arc.life) continue;
        aliveArcs.push(arc);

        // Quadratic ease-out for clean fade
        const progress = age / arc.life;
        const opacity = 1 - progress * progress;

        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(200, 240, 255, 0.6)";

        ctx.beginPath();
        ctx.moveTo(arc.points[0].x, arc.points[0].y);
        for (let j = 1; j < arc.points.length; j++) {
          ctx.lineTo(arc.points[j].x, arc.points[j].y);
        }

        ctx.strokeStyle = `rgba(200, 240, 255, ${opacity})`;
        ctx.lineWidth = 1.5 * (1 - progress * 0.6);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
      arcs.current = aliveArcs;

      ctx.globalCompositeOperation = "source-over";

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
