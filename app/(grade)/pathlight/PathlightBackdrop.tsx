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

      {/* 1.5 — The 3D Astrophysical Moon (realistic spherical edge + moonlight) */}
      <div className="absolute pointer-events-none rounded-full h-[225px] w-[225px] top-[calc(22vh_-_112px)] left-[-75px] md:h-[425px] md:w-[425px] md:top-[calc(25vh_-_212px)] md:left-[-148px]">

        {/* Layer 1: Atmospheric moonlight glow (cool silver/cyan/indigo bleed) */}
        <div
          className="absolute inset-0 rounded-full mix-blend-screen"
          style={{
            boxShadow: "0 0 60px 15px rgba(248, 250, 252, 0.45), 0 0 140px 50px rgba(186, 230, 253, 0.25), 0 0 380px 160px rgba(147, 197, 253, 0.12)"
          }}
        />

        {/* Layer 2: Physical Moon Body (opaque, blocks stars, perfect edge) */}
        <div className="absolute inset-0 rounded-full bg-black overflow-hidden">
          <div
            className="pathlight-moon w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url(/brand/moon.webp)",
              filter: "sepia(8%) hue-rotate(-12deg) contrast(1.25) brightness(1.15) saturate(0.95)"
            }}
          />
        </div>

        {/* Layer 3: True Spherical Terminator (deep shadow on one side for 3D volume + rounded edge) */}
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

        {/* Horizon Terrain & Thunderheads */}
        <svg viewBox="0 0 1440 400" className="absolute bottom-0 w-full h-auto min-h-[250px] md:min-h-[400px] object-cover" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Heavy West Texas Thunderhead Clouds (subtle distant storm feel) */}
          <path d="M0,210 Q140,165 320,195 T680,155 T1050,185 T1440,165 L1440,400 L0,400 Z" fill="url(#cloud-grad)" filter="blur(6px)" />

          {/* West Texas Mesas - Distant Layer (flat-topped plateaus) */}
          <path d="M0,275 L70,275 L110,315 L240,315 L275,260 L440,260 L490,330 L640,330 L695,265 L880,265 L930,305 L1135,305 L1195,255 L1440,255 L1440,400 L0,400 Z" fill="#0f172a" opacity="0.85"/>

          {/* West Texas Mesas - Foreground Layer (sharp canyons & steep drops) */}
          <path d="M0,315 L95,315 L145,365 L295,365 L340,285 L535,285 L595,375 L785,375 L840,295 L1035,295 L1095,345 L1290,345 L1345,305 L1440,305 L1440,400 L0,400 Z" fill="#020617" />
        </svg>

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
