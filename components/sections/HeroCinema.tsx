"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";

type Phase = "blueprint" | "build" | "reveal" | "complete";

interface HeroCinemaProps {
  onRevealComplete: () => void;
}

export default function HeroCinema({ onRevealComplete }: HeroCinemaProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
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

  /* ─── Wait for custom fonts to prevent FOUT CLS ─── */
  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  /* ─── Scroll / Touch / Key trigger (Act 1 → Act 2) ─── */
  useEffect(() => {
    if (!active || !fontsLoaded || phase !== "blueprint") return;

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
  }, [active, fontsLoaded, phase]);

  const layerClasses = [
    "hero-cinema-layer",
    phase === "build" || phase === "reveal" ? "hero-cinema-build" : "",
    phase === "reveal" || phase === "complete"
      ? "hero-cinema-reveal"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const layerVisible = active && fontsLoaded && phase !== "complete";
  const overlayVisible = active && phase !== "complete";

  return (
    <>
      {/* ════ DARK OVERLAY (z-[100]) ════ */}
      <div
        ref={overlayRef}
        className={`hero-cinema-overlay${
          phase === "reveal" ? " hero-cinema-overlay-reveal" : ""
        }`}
        style={{
          opacity: overlayVisible ? undefined : 0,
          pointerEvents: overlayVisible ? undefined : "none",
        }}
        aria-hidden="true"
      >
        <div
          className="dot-grid absolute inset-0"
          style={{ opacity: 0.15 }}
        />
      </div>

      {/* ════ SVG TEXT VIEWPORT (z-[110]) ════ */}
      <div
        ref={svgLayerRef}
        className="hero-cinema-viewport"
        style={{
          opacity: layerVisible ? 1 : 0,
          pointerEvents: layerVisible ? "none" : "none",
        }}
        aria-hidden="true"
      >
        <div className={layerClasses}>
          <svg
            viewBox="0 0 1100 400"
            preserveAspectRatio="xMidYMid meet"
            className="hero-cinema-svg"
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
