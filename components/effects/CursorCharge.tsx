"use client";

import { useEffect, useRef } from "react";

/* ─── CONSTANTS & CONFIG ─── */
const HOVER_RADIUS = 12; // Tighter, contained circular plasma
const HOVER_LIFE = 120; // Hyper-fast sizzle
const CLICK_LENGTH = 70; // Long, striking distance
const CLICK_LIFE = 400; // Lingers slightly to show the strobe
const BRANCH_PROBABILITY = 0.35; // 35% chance a bolt splits

/* ─── TYPES ─── */
interface Point { x: number; y: number; }
interface BoltSegment { start: Point; end: Point; thickness: number; alpha: number; }
interface PlasmaStrike { segments: BoltSegment[]; birth: number; life: number; isHover: boolean; }

/* ─── FRACTAL LIGHTNING GENERATOR ─── */
// Recursive midpoint displacement for hyper-realistic branching lightning
function generateFractalBolt(
  startX: number, startY: number,
  endX: number, endY: number,
  displace: number, minLength: number,
  thickness: number, alpha: number,
  segments: BoltSegment[]
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < minLength) {
    segments.push({ start: { x: startX, y: startY }, end: { x: endX, y: endY }, thickness, alpha });
    return;
  }

  // Find midpoint and displace perpendicularly
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const normalX = -dy / length;
  const normalY = dx / length;

  const randomDisplace = (Math.random() - 0.5) * displace;
  const newX = midX + normalX * randomDisplace;
  const newY = midY + normalY * randomDisplace;

  // Recurse for the two new halves, reducing displacement to create fractal detail
  generateFractalBolt(startX, startY, newX, newY, displace / 2, minLength, thickness, alpha, segments);
  generateFractalBolt(newX, newY, endX, endY, displace / 2, minLength, thickness, alpha, segments);

  // Branching logic (only if it's a thick enough trunk)
  if (thickness > 0.5 && Math.random() < BRANCH_PROBABILITY) {
    const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
    const branchLen = length * (0.4 + Math.random() * 0.4);
    const bx = newX + Math.cos(branchAngle) * branchLen;
    const by = newY + Math.sin(branchAngle) * branchLen;
    // The branch is thinner and fainter
    generateFractalBolt(newX, newY, bx, by, displace / 1.5, minLength, thickness * 0.6, alpha * 0.7, segments);
  }
}

export function CursorCharge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const pos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovering = useRef(false);
  const inText = useRef(false);
  const strikes = useRef<PlasmaStrike[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

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

    const isInteractive = (el: HTMLElement) => el.closest("a, button, [role='button'], summary, label");
    const isTextEl = (el: HTMLElement) => el.closest("input, textarea, select, [contenteditable='true']");

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

    /* ─── CLICK: METAPHYSICAL DISCHARGE ─── */
    const onDown = () => {
      if (inText.current) return;
      const now = performance.now();
      const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 main trunks

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * (i / count)) + (Math.random() - 0.5) * 0.8;
        const length = CLICK_LENGTH * (0.8 + Math.random() * 0.5);
        const endX = pos.current.x + Math.cos(angle) * length;
        const endY = pos.current.y + Math.sin(angle) * length;

        const segments: BoltSegment[] = [];
        // Heavy displacement for violent strike
        generateFractalBolt(pos.current.x, pos.current.y, endX, endY, 35, 4, 1.0, 1.0, segments);
        strikes.current.push({ segments, birth: now, life: CLICK_LIFE, isHover: false });
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

    /* ─── RENDER ENGINE ─── */
    const frame = (now: number) => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      const { x, y } = pos.current;

      /* ─── HOVER: FRACTAL PLASMA RING ─── */
      if (isVisible.current && !inText.current && isHovering.current) {
        // Spawn 1-2 tiny contained fractal sparks per frame
        const sparks = Math.floor(Math.random() * 2) + 1;
        for(let i=0; i<sparks; i++) {
          const angle1 = Math.random() * Math.PI * 2;
          const angle2 = angle1 + (Math.random() - 0.5) * 1.5; // Connects to a nearby point on the circle

          const r1 = HOVER_RADIUS * (0.8 + Math.random() * 0.4);
          const r2 = HOVER_RADIUS * (0.8 + Math.random() * 0.4);

          const startX = x + Math.cos(angle1) * r1;
          const startY = y + Math.sin(angle1) * r1;
          const endX = x + Math.cos(angle2) * r2;
          const endY = y + Math.sin(angle2) * r2;

          const segments: BoltSegment[] = [];
          // Tight displacement for a sizzling coil effect
          generateFractalBolt(startX, startY, endX, endY, 8, 3, 0.6, 0.8, segments);
          strikes.current.push({ segments, birth: now, life: HOVER_LIFE, isHover: true });
        }
      }

      /* ─── DUAL-PASS RENDER LOOP ─── */
      ctx.globalCompositeOperation = "screen";
      const aliveStrikes: PlasmaStrike[] = [];

      for (let i = 0; i < strikes.current.length; i++) {
        const strike = strikes.current[i];
        const age = now - strike.birth;
        if (age >= strike.life) continue;
        aliveStrikes.push(strike);

        const progress = age / strike.life;

        // Stroboscopic Decay (Flickers violently before dying)
        const strobe = strike.isHover ? 1 : (Math.random() > 0.3 ? 1 : 0.4);
        const opacity = (1 - progress * progress) * strobe;

        if (opacity <= 0.01) continue;

        // Draw all segments for this strike
        for (let j = 0; j < strike.segments.length; j++) {
          const seg = strike.segments[j];
          const segOpacity = opacity * seg.alpha;

          ctx.beginPath();
          ctx.moveTo(seg.start.x, seg.start.y);
          ctx.lineTo(seg.end.x, seg.end.y);

          // PASS 1: The Corona (Cyan Plasma Glow)
          ctx.strokeStyle = `rgba(0, 229, 255, ${segOpacity * 0.7})`;
          ctx.lineWidth = (strike.isHover ? 3 : 5) * seg.thickness * (1 - progress * 0.3);
          ctx.shadowBlur = strike.isHover ? 10 : 25;
          ctx.shadowColor = "#00e5ff";
          ctx.lineCap = "round";
          ctx.stroke();

          // PASS 2: The Hot Core (Pure White)
          ctx.strokeStyle = `rgba(255, 255, 255, ${segOpacity})`;
          ctx.lineWidth = (strike.isHover ? 0.8 : 1.5) * seg.thickness;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
      strikes.current = aliveStrikes;
      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

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
