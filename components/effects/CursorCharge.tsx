"use client";

import { useEffect, useRef } from "react";

/* ─── TIP OFFSET ────────────────────────────────────── */
const TIP_X = 1;
const TIP_Y = 3;

/* ─── ARC CONFIG ────────────────────────────────────── */
const ARC_LIFE = 170;       // ms total lifetime
const ARC_MIN = 2;
const ARC_MAX = 4;
const ARC_LENGTH = 18;      // max px reach
const ARC_STEPS = 5;        // segments per arc
const ARC_WIDTH = 1.0;      // base stroke width (CSS px)

/* ─── PULSE CONFIG ──────────────────────────────────── */
const PULSE_PERIOD = 1800;  // ms for one full idle pulse cycle
const PULSE_MIN_R = 1.8;    // idle min radius
const PULSE_MAX_R = 2.6;    // idle max radius
const PULSE_MIN_A = 0.35;   // idle min opacity
const PULSE_MAX_A = 0.6;    // idle max opacity
const HOVER_MIN_R = 2.4;
const HOVER_MAX_R = 3.4;
const HOVER_MIN_A = 0.55;
const HOVER_MAX_A = 0.85;

/* ─── ARC TYPE ──────────────────────────────────────── */
interface Arc {
  pts: Float64Array; // flat x,y pairs
  birth: number;
}

export function CursorCharge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const pos = useRef({ x: -100, y: -100 });
  const hovering = useRef(false);
  const visible = useRef(false);
  const inText = useRef(false);
  const arcs = useRef<Arc[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    /* ── High-DPI setup ── */
    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Mouse ── */
    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      visible.current = true;
    };
    const onEnter = () => { visible.current = true; };
    const onLeave = () => { visible.current = false; };

    const isInteractive = (el: HTMLElement) =>
      el.closest("a,button,[role='button'],[data-cursor-hover],summary,label[for],.glass-card-hover,.btn-primary,.btn-outline");
    const isTextEl = (el: HTMLElement) =>
      el.closest("input:not([type='submit']):not([type='button']):not([type='reset']),textarea,select,[contenteditable='true']");

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement;
      if (isTextEl(t)) { inText.current = true; hovering.current = false; }
      else { inText.current = false; if (isInteractive(t)) hovering.current = true; }
    };
    const onOut = (e: Event) => {
      const rel = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!rel || !isInteractive(rel)) hovering.current = false;
      if (!rel || !isTextEl(rel)) inText.current = false;
    };

    /* ── Spawn arcs on click ── */
    const onDown = () => {
      if (inText.current) return;
      const cx = pos.current.x + TIP_X;
      const cy = pos.current.y + TIP_Y;
      const now = performance.now();
      const count = ARC_MIN + Math.floor(Math.random() * (ARC_MAX - ARC_MIN + 1));

      for (let i = 0; i < count; i++) {
        const baseAngle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 1.0;
        const pts = new Float64Array((ARC_STEPS + 1) * 2);
        pts[0] = cx;
        pts[1] = cy;
        let x = cx;
        let y = cy;
        let angle = baseAngle;

        for (let s = 1; s <= ARC_STEPS; s++) {
          // Each segment gets slightly shorter — gives natural taper
          const segLen = (ARC_LENGTH / ARC_STEPS) * (1.1 - s * 0.12) * (0.7 + Math.random() * 0.6);
          // Smooth angular drift — not random jitter
          angle += (Math.random() - 0.5) * 0.7;
          x += Math.cos(angle) * segLen;
          y += Math.sin(angle) * segLen;
          pts[s * 2] = x;
          pts[s * 2 + 1] = y;
        }
        arcs.current.push({ pts, birth: now });
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.addEventListener("mousedown", onDown);

    /* ── Smooth ease-out curve ── */
    const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

    /* ── Render loop ── */
    const frame = (now: number) => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const tipX = pos.current.x + TIP_X;
      const tipY = pos.current.y + TIP_Y;
      const show = visible.current && !inText.current;
      const hov = hovering.current;

      if (show) {
        /* ── Idle radiating spark pulse ── */
        const cycle = (now % PULSE_PERIOD) / PULSE_PERIOD;
        // Smooth sine-based pulse: 0→1→0 over the cycle
        const pulse = 0.5 + 0.5 * Math.sin(cycle * Math.PI * 2);

        const minR = hov ? HOVER_MIN_R : PULSE_MIN_R;
        const maxR = hov ? HOVER_MAX_R : PULSE_MAX_R;
        const minA = hov ? HOVER_MIN_A : PULSE_MIN_A;
        const maxA = hov ? HOVER_MAX_A : PULSE_MAX_A;

        const r = minR + (maxR - minR) * pulse;
        const alpha = minA + (maxA - minA) * pulse;

        // Core: solid charcoal center
        ctx.beginPath();
        ctx.arc(tipX, tipY, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(50,50,55,${alpha})`;
        ctx.fill();

        // Mid ring: silver haze
        ctx.beginPath();
        ctx.arc(tipX, tipY, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,180,190,${alpha * 0.25})`;
        ctx.fill();

        // Outer bloom: faintest white halo
        ctx.beginPath();
        ctx.arc(tipX, tipY, r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,220,228,${alpha * 0.08})`;
        ctx.fill();
      }

      /* ── Lightning arcs ── */
      const alive: Arc[] = [];
      for (const arc of arcs.current) {
        const age = now - arc.birth;
        if (age >= ARC_LIFE) continue;
        alive.push(arc);

        const t = age / ARC_LIFE;            // 0 → 1
        const fade = 1 - easeOut(t);         // smooth ease-out fade
        const taper = 1 - t * 0.5;           // line width taper

        // Draw the arc with quadratic curves for smoothness
        ctx.beginPath();
        ctx.moveTo(arc.pts[0], arc.pts[1]);

        for (let s = 1; s <= ARC_STEPS; s++) {
          const x = arc.pts[s * 2];
          const y = arc.pts[s * 2 + 1];
          if (s === 1) {
            ctx.lineTo(x, y);
          } else {
            // Smooth midpoint interpolation
            const px = arc.pts[(s - 1) * 2];
            const py = arc.pts[(s - 1) * 2 + 1];
            const mx = (px + x) / 2;
            const my = (py + y) / 2;
            ctx.quadraticCurveTo(px, py, mx, my);
          }
        }
        // Final segment to last point
        ctx.lineTo(arc.pts[ARC_STEPS * 2], arc.pts[ARC_STEPS * 2 + 1]);

        // Silver → charcoal fade based on lifetime
        const bright = Math.round(210 - t * 100);
        ctx.strokeStyle = `rgba(${bright},${bright},${bright + 5},${fade * 0.8})`;
        ctx.lineWidth = ARC_WIDTH * taper;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Tiny white flash at arc origin during first 25% of life
        if (t < 0.25) {
          const flashA = fade * 0.5 * (1 - t / 0.25);
          ctx.beginPath();
          ctx.arc(arc.pts[0], arc.pts[1], 1.5 * (1 - t), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,240,245,${flashA})`;
          ctx.fill();
        }
      }
      arcs.current = alive;

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mousedown", onDown);
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
