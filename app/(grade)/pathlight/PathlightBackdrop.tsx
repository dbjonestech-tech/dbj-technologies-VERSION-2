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

        {/* Horizon Terrain & Thunderheads */}
        <svg viewBox="0 0 1440 400" className="absolute bottom-0 w-full h-auto min-h-[250px] md:min-h-[400px] object-cover" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* userSpaceOnUse gradients so sedimentary bands align at absolute viewBox y-coords across every formation */}
            <linearGradient id="mesa-distant" x1="0" y1="225" x2="0" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3a2e52" />
              <stop offset="100%" stopColor="#2d2640" />
            </linearGradient>
            <linearGradient id="mesa-mid" x1="0" y1="260" x2="0" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5c3520" />
              <stop offset="22%" stopColor="#5c3520" />
              <stop offset="24%" stopColor="#7a4528" />
              <stop offset="32%" stopColor="#7a4528" />
              <stop offset="34%" stopColor="#4a2c1a" />
              <stop offset="54%" stopColor="#4a2c1a" />
              <stop offset="56%" stopColor="#6b3d25" />
              <stop offset="68%" stopColor="#6b3d25" />
              <stop offset="70%" stopColor="#3a2012" />
              <stop offset="100%" stopColor="#3a2012" />
            </linearGradient>
            <linearGradient id="mesa-near" x1="0" y1="240" x2="0" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7a4528" />
              <stop offset="15%" stopColor="#7a4528" />
              <stop offset="17%" stopColor="#8b4a2a" />
              <stop offset="26%" stopColor="#8b4a2a" />
              <stop offset="28%" stopColor="#6b3a1f" />
              <stop offset="45%" stopColor="#6b3a1f" />
              <stop offset="47%" stopColor="#8b4a2a" />
              <stop offset="55%" stopColor="#8b4a2a" />
              <stop offset="57%" stopColor="#5a3018" />
              <stop offset="75%" stopColor="#5a3018" />
              <stop offset="77%" stopColor="#6b3a1f" />
              <stop offset="100%" stopColor="#3a2012" />
            </linearGradient>
            <linearGradient id="mesa-foreground" x1="0" y1="340" x2="0" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#231508" />
              <stop offset="100%" stopColor="#1a0f08" />
            </linearGradient>
          </defs>

          {/* Canyon Layer 1 — Distant range, atmospheric perspective */}
          <path
            d="M0,258 L160,258 L176,248 L282,248 L300,258 L428,258 L448,242 L612,242 L634,252 L798,252 L822,236 L990,236 L1012,246 L1178,246 L1204,230 L1378,230 L1402,242 L1440,242 L1440,400 L0,400 Z"
            fill="url(#mesa-distant)"
            opacity="0.22"
          />

          {/* Canyon Layer 2 — Mid-distance canyon walls, wedding-cake step-backs with sedimentary banding */}
          <path
            d="M0,305 L80,305 L80,282 L170,282 L170,268 L240,268 L240,290 L275,290 L285,320 L360,320 L360,295 L450,295 L455,275 L528,275 L528,302 L555,302 L570,322 L640,322 L640,288 L720,288 L725,272 L805,272 L805,295 L840,295 L852,325 L930,325 L930,298 L1008,298 L1010,282 L1090,282 L1090,308 L1118,308 L1128,330 L1205,330 L1205,295 L1290,295 L1290,278 L1370,278 L1375,298 L1410,298 L1420,320 L1440,320 L1440,400 L0,400 Z"
            fill="url(#mesa-mid)"
            opacity="0.42"
          />

          {/* Canyon Layer 3 — Near buttes & mesas (Monument Valley tall butte + wide Palo Duro mesa, banded cliff faces) */}
          <path
            d="M0,345 L50,345 L58,335 L130,335 L140,318 L230,318 L238,348 L315,348 L325,332 L395,332 L400,310 L430,310 L432,248 L465,244 L467,252 L478,320 L485,340 L545,340 L550,328 L625,328 L630,315 L700,315 L712,358 L778,358 L782,345 L818,345 L820,275 L1010,275 L1013,298 L1035,298 L1037,320 L1058,320 L1068,345 L1145,345 L1152,332 L1225,332 L1232,312 L1295,312 L1302,340 L1345,340 L1352,325 L1420,325 L1425,342 L1440,342 L1440,400 L0,400 Z"
            fill="url(#mesa-near)"
            opacity="0.62"
          />

          {/* Canyon Layer 4 — Foreground silhouette, irregular rocky top edge */}
          <path
            d="M0,372 L48,372 L62,362 L118,362 L132,380 L175,380 L192,370 L285,370 L302,382 L385,382 L402,372 L495,372 L512,385 L595,385 L615,370 L688,370 L702,378 L775,378 L790,368 L892,368 L912,380 L988,380 L1008,370 L1090,370 L1108,382 L1195,382 L1215,370 L1295,370 L1312,378 L1380,378 L1398,368 L1440,368 L1440,400 L0,400 Z"
            fill="url(#mesa-foreground)"
            opacity="0.96"
          />
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
