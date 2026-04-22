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
          boxShadow: "0 0 40px 10px rgba(255, 253, 245, 0.25), 0 0 120px 50px rgba(200, 220, 255, 0.15), 0 0 250px 100px rgba(180, 200, 240, 0.08)",
          opacity: 0.9
        }}
      >
        <div
          className="pathlight-moon w-full h-full rounded-full bg-cover bg-center"
          style={{
            backgroundImage: "url(/brand/moon.webp)",
            maskImage: "radial-gradient(circle at center, black 55%, transparent 95%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 55%, transparent 95%)",
            opacity: 0.8
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

      {/* 5a — Canyon silhouette BACK (lightest, tallest) */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[15%] md:h-[30%]"
      >
        <path
          fill="#0f0f1a"
          d="M0,400 L0,280 L100,280 L100,140 L420,140 L420,280 L560,280 L560,310 L720,310 L720,220 L960,220 L960,140 L1100,140 L1100,280 L1220,280 L1220,200 L1320,200 L1320,280 L1440,280 L1440,400 Z"
        />
      </svg>

      {/* 5b — Canyon silhouette MIDDLE */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[11%] md:h-[22%]"
      >
        <path
          fill="#0a0a14"
          d="M0,400 L0,320 L80,280 L180,300 L240,260 L300,270 L360,230 L440,250 L520,260 L560,240 L600,320 L700,320 L780,240 L880,200 L980,70 L1050,90 L1080,230 L1180,250 L1260,290 L1360,270 L1440,300 L1440,400 Z"
        />
      </svg>

      {/* 5c — Canyon silhouette FRONT (darkest, broken V-gap center) */}
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[6%] md:h-[12%]"
      >
        <path
          fill="#050510"
          d="M0,400 L0,340 L120,320 L220,350 L340,310 L460,340 L560,290 L660,260 L720,380 L780,260 L860,310 L960,290 L1080,340 L1200,300 L1320,350 L1440,320 L1440,400 Z"
        />
      </svg>
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
