"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";

type Phase = "blueprint" | "build" | "reveal" | "complete";

interface HeroCinemaProps {
  onRevealComplete: () => void;
}

export default function HeroCinema({ onRevealComplete }: HeroCinemaProps) {
  const [phase, setPhase] = useState<Phase>("blueprint");
  const [active, setActive] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const svgLayerRef = useRef<HTMLDivElement>(null);

  /* ─── Skip if already revealed or reduced motion ─── */
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) {
      setActive(false);
      onRevealComplete();
      return;
    }
    try {
      if (sessionStorage.getItem("hero-revealed") === "true") {
        setActive(false);
        onRevealComplete();
        return;
      }
    } catch {
      /* sessionStorage blocked */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Scroll / Touch / Key trigger (Act 1 → Act 2) ─── */
  useEffect(() => {
    if (!active || phase !== "blueprint") return;

    const trigger = () => {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);

      if (overlayRef.current)
        overlayRef.current.style.willChange = "opacity";
      if (svgLayerRef.current)
        svgLayerRef.current.style.willChange = "transform, opacity";

      setPhase("build");

      // Act 2 → Act 3 (after 1.5s build)
      setTimeout(() => {
        setPhase("reveal");

        // Act 3 complete (after 0.8s reveal)
        setTimeout(() => {
          setPhase("complete");
          document.body.style.overflow = "";
          try {
            sessionStorage.setItem("hero-revealed", "true");
          } catch {
            /* noop */
          }

          onRevealComplete();

          if (overlayRef.current) {
            overlayRef.current.style.opacity = "0";
            overlayRef.current.style.pointerEvents = "none";
            overlayRef.current.style.willChange = "auto";
          }
          if (svgLayerRef.current) {
            svgLayerRef.current.style.opacity = "0";
            svgLayerRef.current.style.pointerEvents = "none";
            svgLayerRef.current.style.willChange = "auto";
          }
        }, 800);
      }, 1500);
    };

    const onWheel = () => trigger();
    const onTouch = () => trigger();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        trigger();
      }
    };

    window.addEventListener("wheel", onWheel, { once: true, passive: true });
    window.addEventListener("touchstart", onTouch, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, phase]);

  if (!active) return null;

  const svgClasses = [
    "hero-cinema-layer",
    phase === "build" || phase === "reveal" ? "hero-cinema-build" : "",
    phase === "reveal" ? "hero-cinema-reveal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* ════ DARK OVERLAY (z-[100]) ════ */}
      <div
        ref={overlayRef}
        className={`hero-cinema-overlay${
          phase === "reveal" ? " hero-cinema-overlay-reveal" : ""
        }`}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 100,
        }}
        aria-hidden="true"
      >
        <div
          className="dot-grid absolute inset-0"
          style={{ opacity: 0.15 }}
        />
      </div>

      {/* ════ SVG TEXT LAYER (z-[110]) ════ */}
      <div
        ref={svgLayerRef}
        className={svgClasses}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(1.3)",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: "relative",
            width: "90%",
            maxWidth: 1100,
            margin: "0 auto",
            height: 0,
            paddingBottom: "36.36%",
          }}
        >
          <svg
            viewBox="0 0 1100 400"
            className="hero-cinema-svg"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Shimmer gradient for wireframe stroke on "Impossible." */}
              <linearGradient
                id="hero-shimmer"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="400"
                y2="0"
              >
                <stop offset="0" stopColor="#60a5fa" />
                <stop offset="0.5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#a78bfa" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-600;600"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </linearGradient>

              {/* Accent fill gradient for "Impossible." solid state */}
              <linearGradient
                id="hero-accent-fill"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>

            {/* Line 1: "Architect The" */}
            <text
              x="550"
              y="165"
              textAnchor="middle"
              className="hero-cinema-line"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: 120,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                willChange: "opacity, stroke-dashoffset",
              }}
              stroke="#60a5fa"
              strokeWidth="1"
              fill="#f0f0f5"
              strokeDasharray="2000"
              strokeDashoffset="2000"
            >
              <tspan
                className="hero-cinema-word"
                style={{ "--word-delay": "0ms" } as CSSProperties}
              >
                {"Architect "}
              </tspan>
              <tspan
                className="hero-cinema-word"
                style={{ "--word-delay": "250ms" } as CSSProperties}
              >
                The
              </tspan>
            </text>

            {/* Line 2: "Impossible." */}
            <text
              x="550"
              y="315"
              textAnchor="middle"
              className="hero-cinema-line hero-cinema-accent"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: 120,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                willChange: "opacity, stroke-dashoffset",
              }}
              stroke="url(#hero-shimmer)"
              strokeWidth="1"
              fill="url(#hero-accent-fill)"
              strokeDasharray="2000"
              strokeDashoffset="2000"
            >
              <tspan
                className="hero-cinema-word"
                style={{ "--word-delay": "750ms" } as CSSProperties}
              >
                Impossible.
              </tspan>
            </text>
          </svg>
        </div>

        {/* Light sweep during build phase */}
        <div
          className="hero-cinema-sweep"
          style={{ opacity: phase === "build" ? 1 : 0 }}
        />
      </div>
    </>
  );
}
