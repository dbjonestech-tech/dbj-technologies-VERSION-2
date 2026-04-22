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

      {/* 1.5 — The 3D Astrophysical Moon */}
      <div className="absolute pointer-events-none rounded-full h-[225px] w-[225px] top-[calc(22vh_-_112px)] left-[-75px] md:h-[425px] md:w-[425px] md:top-[calc(25vh_-_212px)] md:left-[-148px]">

        {/* Layer 1: Atmospheric Glow (Additive light) */}
        <div
          className="absolute inset-0 rounded-full mix-blend-screen"
          style={{
            boxShadow: "0 0 50px 10px rgba(255, 255, 255, 0.3), 0 0 120px 40px rgba(186, 230, 253, 0.2), 0 0 350px 150px rgba(99, 102, 241, 0.08)"
          }}
        />

        {/* Layer 2: Physical Moon Body (Opaque, blocks stars) */}
        <div className="absolute inset-0 rounded-full bg-black overflow-hidden">
          <div
            className="pathlight-moon w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url(/brand/moon.webp)",
              filter: "sepia(10%) hue-rotate(-10deg) contrast(1.2) brightness(1.1)"
            }}
          />
        </div>

        {/* Layer 3: The 3D Terminator Shadow (Creates the spherical depth) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "inset -50px -50px 80px rgba(0,0,0,0.95), inset 10px 10px 30px rgba(255,255,255,0.25)"
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

      {/* Canyon, Storm, and Constellations */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-full overflow-hidden pointer-events-none z-[1]">

        {/* Constellations & Mars (Absolute Top/Right) */}
        <svg className="absolute top-0 right-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Mars - Subtle red pulse */}
          <circle cx="85%" cy="20%" r="2" fill="#fca5a5" className="animate-mars" filter="blur(1px)"/>
          {/* Orion's Belt (Subtle) */}
          <circle cx="70%" cy="28%" r="1" fill="#e2e8f0" opacity="0.6"/>
          <circle cx="71%" cy="27%" r="1.2" fill="#e2e8f0" opacity="0.8"/>
          <circle cx="72%" cy="26%" r="1" fill="#e2e8f0" opacity="0.6"/>
        </svg>

        {/* Horizon Terrain & Storm Clouds */}
        <svg viewBox="0 0 1440 400" className="absolute bottom-0 w-full h-auto min-h-[250px] md:min-h-[400px] object-cover" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="lightning-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Distant Lightning Flash Layer (Blurred for atmospheric scatter) */}
          <path d="M100,200 Q300,100 600,180 T1000,150 T1440,220 L1440,400 L0,400 Z" fill="url(#lightning-grad)" className="animate-lightning" filter="blur(8px)" />

          {/* Thunderhead Clouds (Rolling, thick, behind mountains) */}
          <path d="M0,220 Q80,180 150,200 T300,160 T500,190 T700,140 T950,170 T1200,130 T1440,180 L1440,400 L0,400 Z" fill="url(#cloud-grad)" />

          {/* True West Texas Mesas - Distant Layer (Sweeping Bezier Curves) */}
          <path d="M0,250 Q100,230 200,240 T400,220 L450,220 Q500,220 550,250 T750,230 L800,230 Q900,230 1000,260 T1200,240 T1440,250 L1440,400 L0,400 Z" fill="#0f172a" opacity="0.8"/>

          {/* True West Texas Mesas - Foreground Layer (Sharp Canyons and Plateaus) */}
          <path d="M0,280 Q80,280 120,260 T250,260 L300,260 Q350,260 400,290 T600,280 Q650,260 700,260 L750,260 Q800,260 850,290 T1100,270 L1150,270 Q1200,270 1250,290 T1440,280 L1440,400 L0,400 Z" fill="#020617" />
        </svg>

        {/* Horizon blend gradient to ground the SVGs */}
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
