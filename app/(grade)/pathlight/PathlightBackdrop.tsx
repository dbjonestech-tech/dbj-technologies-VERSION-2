import { StarField } from "./StarField";

/* ─── PATHLIGHT BACKDROP (scan page) ─────────────────
 * Layers (back-to-front):
 *  1) Sky gradient — deep navy to warm horizon
 *  1.5) Moon — low-hanging NASA lunar texture, rotating
 *  2) Star field — canvas with twinkle (respects reduced motion)
 *  3) Distant lightning — desktop only, CSS @keyframes, flashes
 *     occupy ~2% of each cycle (see globals.css)
 *  4) Warm horizon glow — amber haze along the horizon line
 *  5) Canyon silhouettes — three SVG layers, back to front
 * ─────────────────────────────────────────────────── */
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

      {/* 1.5 — Moon (NASA LRO texture, additive atmospheric scattering, slow rotation) */}
      <div
        className="absolute pointer-events-none mix-blend-screen rounded-full h-[225px] w-[225px] top-[calc(22vh_-_112px)] left-[-75px] md:h-[425px] md:w-[425px] md:top-[calc(25vh_-_212px)] md:left-[-148px]"
        style={{
          boxShadow: "0 0 60px 15px rgba(255, 253, 245, 0.25), 0 0 150px 60px rgba(200, 220, 255, 0.15), 0 0 350px 150px rgba(180, 200, 240, 0.08)",
          opacity: 0.9
        }}
      >
        <div
          className="pathlight-moon w-full h-full rounded-full bg-cover bg-center"
          style={{
            backgroundImage: "url(/brand/moon.webp)",
            maskImage: "radial-gradient(circle at center, black 50%, transparent 95%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 50%, transparent 95%)",
            filter: "sepia(30%) hue-rotate(-15deg) contrast(1.1) brightness(0.85)",
            opacity: 0.75
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

      {/* Canyon Silhouettes - West Texas Mesa */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none z-[1]">
        <svg viewBox="0 0 1440 320" className="w-full h-auto min-h-[150px] md:min-h-[250px] object-cover" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mesa-distant" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="mesa-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#020617" stopOpacity="1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Distant Layer - Soft Mesas fading into dust */}
          <path
            d="M0,250 Q100,230 200,240 T400,220 L450,220 Q500,220 550,250 T750,230 L800,230 Q900,230 1000,260 T1200,240 T1440,250 L1440,320 L0,320 Z"
            fill="url(#mesa-distant)"
          />
          {/* Foreground Layer - Sharp Cliffs and Canyons */}
          <path
            d="M0,280 Q80,280 120,260 T250,260 L300,260 Q350,260 400,290 T600,280 Q650,260 700,260 L750,260 Q800,260 850,290 T1100,270 L1150,270 Q1200,270 1250,290 T1440,280 L1440,320 L0,320 Z"
            fill="url(#mesa-front)"
          />
        </svg>
        {/* Horizon blend gradient to ground the SVGs */}
        <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#020617] to-transparent"></div>
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
