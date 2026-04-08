import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DBJ Technologies | Engineering That Ships";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06060a 0%, #0c0c14 50%, #06060a 100%)",
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "white",
              fontFamily: "sans-serif",
            }}
          >
            D
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "white",
              fontFamily: "sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            DBJ Technologies
          </span>
          <span
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Engineering That Ships
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 24,
            color: "rgba(255,255,255,0.3)",
            fontSize: 14,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          <span>Web Development</span>
          <span>•</span>
          <span>Cloud & DevOps</span>
          <span>•</span>
          <span>UI/UX Design</span>
          <span>•</span>
          <span>Dallas, TX</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
