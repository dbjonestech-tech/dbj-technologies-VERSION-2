"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─── CONSTANTS ─────────────────────────────────────── */
// Native arrow hotspot is at top-left (0,0). Offset the
// charge effect to sit right at the visible tip point.
const TIP_OFFSET_X = 1;
const TIP_OFFSET_Y = 3;

// Arc constants
const ARC_COUNT_MIN = 2;
const ARC_COUNT_MAX = 4;
const ARC_MAX_LENGTH = 14;
const ARC_SEGMENTS = 4;
const ARC_DECAY_MS = 180;

/* ─── TYPES ─────────────────────────────────────────── */
interface Arc {
  segments: { x: number; y: number }[];
  birth: number;
}

/* ─── COMPONENT ─────────────────────────────────────── */
export function CursorCharge() {
  const emberRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);
  const inTextRef = useRef(false);
  const arcsRef = useRef<Arc[]>([]);
  const reducedMotionRef = useRef(false);

  /* ── Generate branching micro arcs from the tip ── */
  const spawnArcs = useCallback((cx: number, cy: number) => {
    if (reducedMotionRef.current) return;
    const count = ARC_COUNT_MIN + Math.floor(Math.random() * (ARC_COUNT_MAX - ARC_COUNT_MIN + 1));
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 1.2;
      const segments: { x: number; y: number }[] = [{ x: cx, y: cy }];
      let x = cx;
      let y = cy;
      for (let s = 0; s < ARC_SEGMENTS; s++) {
        const len = (ARC_MAX_LENGTH / ARC_SEGMENTS) * (0.6 + Math.random() * 0.8);
        const jitter = (Math.random() - 0.5) * 0.8;
        x += Math.cos(angle + jitter) * len;
        y += Math.sin(angle + jitter) * len;
        segments.push({ x, y });
      }
      arcsRef.current.push({ segments, birth: now });
    }
  }, []);

  /* ── Main render loop ── */
  const tick = useCallback(() => {
    const ember = emberRef.current;
    const canvas = canvasRef.current;
    if (!ember || !canvas) return;

    const { x, y } = posRef.current;
    const tipX = x + TIP_OFFSET_X;
    const tipY = y + TIP_OFFSET_Y;
    const visible = visibleRef.current;
    const hovering = hoveringRef.current;
    const inText = inTextRef.current;
    const reduced = reducedMotionRef.current;

    /* ── Ember positioning ── */
    ember.style.transform = `translate3d(${tipX - 3}px, ${tipY - 3}px, 0)`;

    if (!visible || inText) {
      ember.style.opacity = "0";
    } else if (reduced) {
      // Reduced motion: ultra-dim static presence, no animation
      ember.style.opacity = "0.2";
      ember.style.width = "4px";
      ember.style.height = "4px";
      ember.style.boxShadow = "0 0 2px rgba(180,180,185,0.3)";
    } else if (hovering) {
      ember.style.opacity = "0.85";
      ember.style.width = "5px";
      ember.style.height = "5px";
      ember.style.boxShadow =
        "0 0 3px 1px rgba(200,200,210,0.6), 0 0 8px 2px rgba(160,160,170,0.2)";
    } else {
      ember.style.opacity = "0.55";
      ember.style.width = "4px";
      ember.style.height = "4px";
      ember.style.boxShadow =
        "0 0 2px 1px rgba(180,180,185,0.4), 0 0 5px 1px rgba(140,140,150,0.12)";
    }

    /* ── Canvas: draw and decay arcs ── */
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== window.innerWidth * dpr || canvas.height !== window.innerHeight * dpr) {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      const alive: Arc[] = [];

      for (const arc of arcsRef.current) {
        const age = now - arc.birth;
        if (age > ARC_DECAY_MS) continue;
        alive.push(arc);

        const progress = age / ARC_DECAY_MS;
        const alpha = 1 - progress;
        // Monochrome: silver-white to charcoal
        const brightness = Math.round(200 - progress * 120);

        ctx.beginPath();
        ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
        for (let i = 1; i < arc.segments.length; i++) {
          ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
        }
        ctx.strokeStyle = `rgba(${brightness},${brightness},${Math.min(brightness + 10, 255)},${alpha * 0.9})`;
        ctx.lineWidth = 1.2 - progress * 0.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Tiny tip flash at origin
        if (progress < 0.3) {
          ctx.beginPath();
          ctx.arc(arc.segments[0].x, arc.segments[0].y, 1.5 * (1 - progress), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,240,245,${alpha * 0.5})`;
          ctx.fill();
        }
      }
      arcsRef.current = alive;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

    // Listen for changes
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener("change", onMotionChange);

    // Touch device gate
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return () => motionQuery.removeEventListener("change", onMotionChange);

    // Fine pointer gate
    const pointerQuery = window.matchMedia("(pointer: fine)");
    if (!pointerQuery.matches) return () => motionQuery.removeEventListener("change", onMotionChange);

    const handleMove = (e: MouseEvent) => {
      visibleRef.current = true;
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };

    const handleEnter = () => { visibleRef.current = true; };
    const handleLeave = () => { visibleRef.current = false; };

    const isInteractive = (el: HTMLElement) =>
      el.closest("a") ||
      el.closest("button") ||
      el.closest("[role='button']") ||
      el.closest("[data-cursor-hover]") ||
      el.closest("summary") ||
      el.closest("label[for]") ||
      el.closest(".glass-card-hover") ||
      el.closest(".btn-primary") ||
      el.closest(".btn-outline");

    const isTextContext = (el: HTMLElement) =>
      el.closest("input:not([type='submit']):not([type='button']):not([type='reset'])") ||
      el.closest("textarea") ||
      el.closest("select") ||
      el.closest("[contenteditable='true']");

    const handleHoverStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (isTextContext(target)) {
        inTextRef.current = true;
        hoveringRef.current = false;
      } else {
        inTextRef.current = false;
        if (isInteractive(target)) hoveringRef.current = true;
      }
    };

    const handleHoverEnd = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!related || !isInteractive(related)) hoveringRef.current = false;
      if (!related || !isTextContext(related)) inTextRef.current = false;
    };

    const handleDown = (e: MouseEvent) => {
      if (inTextRef.current) return;
      const tipX = e.clientX + TIP_OFFSET_X;
      const tipY = e.clientY + TIP_OFFSET_Y;
      spawnArcs(tipX, tipY);
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseover", handleHoverStart, { passive: true });
    document.addEventListener("mouseout", handleHoverEnd, { passive: true });
    document.addEventListener("mousedown", handleDown);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
      document.removeEventListener("mousedown", handleDown);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [tick, spawnArcs]);

  return (
    <>
      {/* Arc canvas — full viewport, pointer-events-none */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
        aria-hidden="true"
      />
      {/* Ember — tiny charge point at cursor tip */}
      <div
        ref={emberRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block rounded-full"
        style={{
          width: "4px",
          height: "4px",
          willChange: "transform, opacity",
          transition:
            "width 0.2s ease, height 0.2s ease, opacity 0.15s ease, box-shadow 0.25s ease",
          background:
            "radial-gradient(circle, rgba(220,220,225,0.9) 0%, rgba(160,160,168,0.6) 60%, rgba(100,100,110,0.2) 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
