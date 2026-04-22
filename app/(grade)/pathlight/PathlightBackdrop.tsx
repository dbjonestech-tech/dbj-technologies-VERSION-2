"use client";

import { useEffect, useRef } from "react";
import { StarField } from "./StarField";

/* ─── PATHLIGHT BACKDROP (scan page) ─────────────────
 * Layers (back-to-front):
 *  1) Sky gradient — deep navy to warm horizon
 *  1.5) Moon — low-hanging NASA lunar texture, rotating
 *  2) Star field — canvas with twinkle (respects reduced motion)
 *  3) Distant lightning — desktop only, CSS @keyframes, flashes
 *     occupy ~2% of each cycle (see globals.css)
 *  4) Warm horizon glow — amber haze along the horizon line
 *  5) Canyon silhouettes — canvas-rendered procedural terrain (four layers)
 * ─────────────────────────────────────────────────── */

/* ─── MESA CANYON CANVAS ─────────────────────────────
 * Four procedural terrain layers rendered on a single canvas.
 * Each layer is a height profile generated from overlapping sines
 * (low-freq rolling, mid-freq abs-sine mesa plateaus, high-freq rocky
 * detail, seeded hash for edge roughness). Static draw — no RAF loop.
 * Redraws on ResizeObserver to match viewport changes.
 * ─────────────────────────────────────────────────── */
function MesaCanyonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number | null = null;

    const prand = (n: number) => {
      const x = Math.sin(n * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    const draw = () => {
      rafId = null;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW === 0 || cssH === 0) return;

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      const generateProfile = (
        baseYFrac: number,
        ampFrac: number,
        segments: number,
        seed: number,
        mesaBoost: number
      ) => {
        const points: Array<{ x: number; y: number }> = [];
        const step = cssW / segments;
        const baseY = cssH * baseYFrac;
        const amp = cssH * ampFrac;
        for (let i = 0; i <= segments; i++) {
          const x = i * step;
          let y = baseY;
          y -= Math.sin(x * 0.002 + seed) * amp * 0.6;
          y -= Math.abs(Math.sin(x * 0.008 + seed * 2.3)) * amp * 0.3 * mesaBoost;
          y -= Math.sin(x * 0.05 + seed * 7.1) * amp * 0.08;
          y -= (prand(x + seed * 13) - 0.5) * amp * 0.05;
          points.push({ x, y });
        }
        return points;
      };

      const drawLayer = (
        profile: Array<{ x: number; y: number }>,
        fillStyle: CanvasGradient | string,
        alpha: number
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, cssH);
        for (const p of profile) ctx.lineTo(p.x, p.y);
        ctx.lineTo(cssW, cssH);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.restore();
      };

      // Layer 1 — Distant range (opaque; colors darkened to hug the sky for atmospheric perspective)
      const g1 = ctx.createLinearGradient(0, cssH * 0.6, 0, cssH);
      g1.addColorStop(0, "#1a1127");
      g1.addColorStop(1, "#150d24");
      drawLayer(generateProfile(0.75, 0.15, 60, 1.0, 1.0), g1, 1.0);

      // Layer 2 — Mid-distance canyon walls (opaque; warm brown darkened to match prior composite)
      const g2 = ctx.createLinearGradient(0, cssH * 0.48, 0, cssH);
      g2.addColorStop(0, "#381d13");
      g2.addColorStop(1, "#21130a");
      drawLayer(generateProfile(0.7, 0.22, 100, 2.7, 1.2), g2, 1.0);

      // Layer 3 — Near buttes and mesas (opaque; burnt sienna darkened to match prior composite)
      const g3 = ctx.createLinearGradient(0, cssH * 0.5, 0, cssH);
      g3.addColorStop(0, "#58301d");
      g3.addColorStop(1, "#351e0f");
      drawLayer(generateProfile(0.78, 0.28, 120, 5.3, 1.5), g3, 1.0);

      // Layer 4 — Foreground silhouette (unchanged color, now fully opaque)
      drawLayer(generateProfile(0.88, 0.12, 150, 9.1, 1.1), "#0d0805", 1.0);
    };

    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(draw);
    };

    schedule();

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(canvas);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute bottom-0 left-0 w-full h-[27.78vw] min-h-[250px] md:min-h-[400px]"
    />
  );
}

export function PathlightBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* 1 — Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #050510 0%, #0a0a2e 48%, #140a20 72%, #1a0a08 88%, #0d0805 100%)",
        }}
      />

      {/* 1.5 — The 3D Astrophysical Moon (stars now properly behind + realistic spherical edge) */}
      <div className="absolute pointer-events-none rounded-full h-[225px] w-[225px] top-[calc(22vh_-_112px)] left-[-75px] z-[2] md:h-[425px] md:w-[425px] md:top-[calc(25vh_-_212px)] md:left-[-148px]">

        {/* Layer 1: Atmospheric moonlight glow */}
        <div
          className="absolute inset-0 rounded-full mix-blend-screen"
          style={{
            boxShadow: "0 0 60px 15px rgba(248, 250, 252, 0.45), 0 0 140px 50px rgba(186, 230, 253, 0.25), 0 0 380px 160px rgba(147, 197, 253, 0.12)"
          }}
        />

        {/* Layer 2: Physical Moon Body (SOLID black base + texture — this occludes stars) */}
        <div className="absolute inset-0 rounded-full bg-black overflow-hidden">
          <div
            className="pathlight-moon w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url(/brand/moon.webp)",
              filter: "sepia(8%) hue-rotate(-12deg) contrast(1.25) brightness(1.15) saturate(0.95)"
            }}
          />
        </div>

        {/* Layer 3: True Spherical Terminator (deep rounded shadow) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 28% 32%, transparent 38%, rgba(0,0,0,0.97) 82%)"
          }}
        />
      </div>

      {/* 2 — Star field */}
      <StarField />

      {/* 3 — Distant lightning (desktop only) */}
      <div className="hidden md:block">
        <div
          className="absolute"
          style={{
            left: "18%",
            bottom: "18%",
            width: "38%",
            height: "30%",
            background:
              "radial-gradient(ellipse at center, rgba(255,250,240,1) 0%, transparent 65%)",
            opacity: 0,
            animation: "pathlight-lightning-1 12s infinite",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "52%",
            bottom: "14%",
            width: "34%",
            height: "28%",
            background:
              "radial-gradient(ellipse at center, rgba(255,250,240,1) 0%, transparent 65%)",
            opacity: 0,
            animation: "pathlight-lightning-2 14s infinite",
            filter: "blur(10px)",
          }}
        />
        <div
          className="absolute"
          style={{
            left: "8%",
            bottom: "10%",
            width: "28%",
            height: "24%",
            background:
              "radial-gradient(ellipse at center, rgba(255,250,240,1) 0%, transparent 65%)",
            opacity: 0,
            animation: "pathlight-lightning-3 18s infinite",
            filter: "blur(12px)",
          }}
        />
      </div>

      {/* 4 — Horizon glow */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "8%",
          height: "22%",
          background:
            "linear-gradient(to top, rgba(251,146,60,0.09), rgba(251,146,60,0.04) 45%, transparent 100%)",
        }}
      />

      {/* Canyon, Thunderheads, and Mars (cursor lightning untouched) */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-full overflow-hidden pointer-events-none z-[1]">

        {/* Constellations & Mars */}
        <svg className="absolute top-0 right-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Mars - fixed pulse */}
          <circle cx="85%" cy="20%" r="2" fill="#fca5a5" className="animate-mars" filter="blur(1px)"/>
          {/* Orion's Belt (very subtle) */}
          <circle cx="70%" cy="28%" r="1" fill="#e2e8f0" opacity="0.55"/>
          <circle cx="71%" cy="27%" r="1.15" fill="#e2e8f0" opacity="0.75"/>
          <circle cx="72%" cy="26%" r="1" fill="#e2e8f0" opacity="0.55"/>
        </svg>

        {/* Horizon Terrain — canvas-rendered procedural canyon layers */}
        <MesaCanyonCanvas />

        {/* Horizon blend gradient */}
        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-[#020617] to-transparent"></div>
      </div>
    </div>
  );
}

/* ─── REPORT BACKDROP ────────────────────────────────
 * Lighter variant for /pathlight/[scanId]: dimmed stars
 * and a faint top horizon glow only. No silhouettes.
 * ─────────────────────────────────────────────────── */
export function ReportBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#06060a" }}
      />
      <StarField dimmed />
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "100px",
          background:
            "linear-gradient(to bottom, rgba(251,146,60,0.08), rgba(251,146,60,0.02) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}
