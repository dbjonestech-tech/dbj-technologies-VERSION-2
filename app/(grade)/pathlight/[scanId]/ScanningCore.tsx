"use client";

import { useEffect, useRef } from "react";

const CANVAS_SIZE = 320;
const CENTER = CANVAS_SIZE / 2;

const PARTICLE_COUNT = 26;
const PARTICLE_MAX_RADIUS = 72;
const PARTICLE_MIN_RADIUS = 58;
const PARTICLE_COLORS = ["#67e8f9", "#22d3ee", "#0ea5e9"];

const RIPPLE_SPAWN_MIN_MS = 2000;
const RIPPLE_SPAWN_JITTER_MS = 1000;
const RIPPLE_LIFE_MS = 2600;
const RIPPLE_MAX_ACTIVE = 3;
const RIPPLE_START_RADIUS = 10;
const RIPPLE_END_RADIUS = 90;

const HALO_MIN_ALPHA = 0.03;
const HALO_MAX_ALPHA = 0.06;
const HALO_PERIOD_MS = 6000;

const CORE_PULSE_PERIOD_MS = 3000;
const CORE_INNER_RADIUS = 5;
const CORE_OUTER_RADIUS = 30;

type Particle = {
  angle: number;
  speed: number;
  life: number;
  lifeMax: number;
  targetRadius: number;
  color: string;
  size: number;
};

type Ripple = {
  birth: number;
};

function spawnParticle(now: number, out: Particle): void {
  out.angle = Math.random() * Math.PI * 2;
  out.speed = 6 + Math.random() * 8;
  out.lifeMax = 2400 + Math.random() * 1600;
  out.life = now;
  out.targetRadius =
    PARTICLE_MIN_RADIUS +
    Math.random() * (PARTICLE_MAX_RADIUS - PARTICLE_MIN_RADIUS);
  out.color = PARTICLE_COLORS[
    Math.floor(Math.random() * PARTICLE_COLORS.length)
  ]!;
  out.size = 1 + Math.random();
}

function drawStaticFrame(
  ctx: CanvasRenderingContext2D,
  size: number
): void {
  const center = size / 2;

  const halo = ctx.createRadialGradient(center, center, 0, center, center, 150);
  halo.addColorStop(0, "rgba(14, 165, 233, 0.05)");
  halo.addColorStop(0.5, "rgba(14, 165, 233, 0.02)");
  halo.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = "lighter";
  const core = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    CORE_OUTER_RADIUS
  );
  core.addColorStop(0, "rgba(224, 247, 255, 0.95)");
  core.addColorStop(0.35, "rgba(34, 211, 238, 0.7)");
  core.addColorStop(0.8, "rgba(2, 132, 199, 0.25)");
  core.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(center, center, CORE_OUTER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, CORE_INNER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#22d3ee";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
}

export function ScanningCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const resize = () => {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.round(CANVAS_SIZE * dpr);
      canvas.height = Math.round(CANVAS_SIZE * dpr);
      canvas.style.width = `${CANVAS_SIZE}px`;
      canvas.style.height = `${CANVAS_SIZE}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      drawStaticFrame(ctx, CANVAS_SIZE);
      return;
    }

    const now0 = performance.now();
    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      () => {
        const p: Particle = {
          angle: 0,
          speed: 0,
          life: 0,
          lifeMax: 0,
          targetRadius: 0,
          color: PARTICLE_COLORS[0]!,
          size: 1,
        };
        spawnParticle(now0 - Math.random() * 2000, p);
        return p;
      }
    );

    const ripples: Ripple[] = [];
    let nextRippleAt =
      now0 + RIPPLE_SPAWN_MIN_MS + Math.random() * RIPPLE_SPAWN_JITTER_MS;

    let rafId = 0;
    let running = true;

    const draw = (now: number) => {
      if (!running) return;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const haloPhase =
        (Math.sin((now / HALO_PERIOD_MS) * Math.PI * 2) * 0.5 + 0.5);
      const haloAlpha =
        HALO_MIN_ALPHA + (HALO_MAX_ALPHA - HALO_MIN_ALPHA) * haloPhase;

      const halo = ctx.createRadialGradient(
        CENTER,
        CENTER,
        0,
        CENTER,
        CENTER,
        150
      );
      halo.addColorStop(0, `rgba(14, 165, 233, ${haloAlpha})`);
      halo.addColorStop(0.5, `rgba(14, 165, 233, ${haloAlpha * 0.4})`);
      halo.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (now >= nextRippleAt && ripples.length < RIPPLE_MAX_ACTIVE) {
        ripples.push({ birth: now });
        nextRippleAt =
          now + RIPPLE_SPAWN_MIN_MS + Math.random() * RIPPLE_SPAWN_JITTER_MS;
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]!;
        const progress = (now - r.birth) / RIPPLE_LIFE_MS;
        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius =
          RIPPLE_START_RADIUS +
          (RIPPLE_END_RADIUS - RIPPLE_START_RADIUS) * progress;
        const alpha = (1 - progress) * 0.35;
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(103, 232, 249, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        const age = now - p.life;
        if (age >= p.lifeMax) {
          spawnParticle(now, p);
          continue;
        }
        const progress = age / p.lifeMax;
        const radius = progress * p.targetRadius;
        const alpha =
          progress < 0.2
            ? progress / 0.2
            : 1 - (progress - 0.2) / 0.8;
        const x = CENTER + Math.cos(p.angle) * radius;
        const y = CENTER + Math.sin(p.angle) * radius;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(p.color, alpha);
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      const corePulse =
        Math.sin((now / CORE_PULSE_PERIOD_MS) * Math.PI * 2) * 0.5 + 0.5;
      const coreRadiusScale = 0.85 + 0.3 * corePulse;
      const coreAlpha = 0.75 + 0.2 * corePulse;

      const core = ctx.createRadialGradient(
        CENTER,
        CENTER,
        0,
        CENTER,
        CENTER,
        CORE_OUTER_RADIUS * coreRadiusScale
      );
      core.addColorStop(0, `rgba(224, 247, 255, ${coreAlpha})`);
      core.addColorStop(0.35, `rgba(34, 211, 238, ${0.55 * coreAlpha})`);
      core.addColorStop(0.8, `rgba(2, 132, 199, ${0.2 * coreAlpha})`);
      core.addColorStop(1, "rgba(2, 132, 199, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(
        CENTER,
        CENTER,
        CORE_OUTER_RADIUS * coreRadiusScale,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(CENTER, CENTER, CORE_INNER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + 0.2 * corePulse})`;
      ctx.shadowBlur = 14 + 8 * corePulse;
      ctx.shadowColor = "#22d3ee";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        rafId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          display: "block",
        }}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default ScanningCore;
