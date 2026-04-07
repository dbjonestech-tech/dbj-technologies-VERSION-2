"use client";

import { useEffect, useRef, useCallback } from "react";

export function CustomCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const haloPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);
  const pressedRef = useRef(false);

  const updateStyles = useCallback(() => {
    const core = coreRef.current;
    const ring = ringRef.current;
    const halo = haloRef.current;
    if (!core || !ring || !halo) return;

    // Ring: slightly trailing lerp
    ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.18;
    ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.18;

    // Halo: softer trailing lerp
    haloPos.current.x += (posRef.current.x - haloPos.current.x) * 0.1;
    haloPos.current.y += (posRef.current.y - haloPos.current.y) * 0.1;

    const hovering = hoveringRef.current;
    const visible = visibleRef.current;
    const pressed = pressedRef.current;

    // ── Core: dark metallic charged tip ──
    // Larger base size so the dark center is unmistakable
    const coreSize = pressed ? 8 : hovering ? 14 : 10;
    const coreHalf = coreSize / 2;
    core.style.transform = `translate3d(${posRef.current.x - coreHalf}px, ${posRef.current.y - coreHalf}px, 0)`;
    core.style.width = `${coreSize}px`;
    core.style.height = `${coreSize}px`;
    core.style.opacity = visible ? "1" : "0";

    // Subtle blue edge energy — sits outside the dark core, not over it
    if (pressed) {
      core.style.boxShadow =
        "inset 0 0 2px rgba(0,0,0,0.6), 0 0 3px 1px rgba(30,41,59,0.8), 0 0 8px 3px rgba(96,165,250,0.7), 0 0 20px 6px rgba(59,130,246,0.4), 0 0 40px 10px rgba(59,130,246,0.15)";
    } else if (hovering) {
      core.style.boxShadow =
        "inset 0 0 2px rgba(0,0,0,0.5), 0 0 3px 1px rgba(30,41,59,0.7), 0 0 10px 4px rgba(96,165,250,0.55), 0 0 24px 8px rgba(59,130,246,0.3), 0 0 48px 14px rgba(59,130,246,0.12)";
    } else {
      core.style.boxShadow =
        "inset 0 0 2px rgba(0,0,0,0.4), 0 0 2px 1px rgba(30,41,59,0.5), 0 0 6px 2px rgba(96,165,250,0.25), 0 0 14px 4px rgba(59,130,246,0.1)";
    }

    // ── Ring: electrical charge boundary — expands on hover ──
    const ringSize = pressed ? 20 : hovering ? 36 : 26;
    const ringHalf = ringSize / 2;
    ring.style.transform = `translate3d(${ringPos.current.x - ringHalf}px, ${ringPos.current.y - ringHalf}px, 0)`;
    ring.style.width = `${ringSize}px`;
    ring.style.height = `${ringSize}px`;
    ring.style.opacity = visible
      ? pressed
        ? "0.7"
        : hovering
          ? "0.55"
          : "0.2"
      : "0";
    ring.style.borderColor = pressed
      ? "rgba(96,165,250,0.8)"
      : hovering
        ? "rgba(96,165,250,0.5)"
        : "rgba(96,165,250,0.2)";

    // ── Halo: ambient energy field — expands on hover ──
    const haloSize = pressed ? 28 : hovering ? 52 : 38;
    const haloHalf = haloSize / 2;
    halo.style.transform = `translate3d(${haloPos.current.x - haloHalf}px, ${haloPos.current.y - haloHalf}px, 0)`;
    halo.style.width = `${haloSize}px`;
    halo.style.height = `${haloSize}px`;
    halo.style.opacity = visible
      ? pressed
        ? "0.4"
        : hovering
          ? "0.3"
          : "0.1"
      : "0";

    rafRef.current = requestAnimationFrame(updateStyles);
  }, []);

  useEffect(() => {
    // Respect reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMove = (e: MouseEvent) => {
      visibleRef.current = true;
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };

    const handleEnter = () => {
      visibleRef.current = true;
    };
    const handleLeave = () => {
      visibleRef.current = false;
    };

    const isInteractive = (el: HTMLElement) =>
      el.closest("a") ||
      el.closest("button") ||
      el.closest("[role='button']") ||
      el.closest("[data-cursor-hover]") ||
      el.closest("summary") ||
      el.closest("label[for]") ||
      el.closest(".glass-card-hover") ||
      el.closest(".btn-primary") ||
      el.closest(".btn-outline");

    const handleHoverStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (isInteractive(target)) hoveringRef.current = true;
    };

    const handleHoverEnd = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!related || !isInteractive(related)) hoveringRef.current = false;
    };

    const handleDown = () => {
      pressedRef.current = true;
    };
    const handleUp = () => {
      pressedRef.current = false;
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseover", handleHoverStart, { passive: true });
    document.addEventListener("mouseout", handleHoverEnd, { passive: true });
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);

    rafRef.current = requestAnimationFrame(updateStyles);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [updateStyles]);

  return (
    <>
      {/* Halo: ambient energy field */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-[10001] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity, width, height",
          transition:
            "width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Ring: electrical charge boundary */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[10002] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity, width, height",
          transition:
            "width 0.25s cubic-bezier(0.4,0,0.2,1), height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, border-color 0.25s ease",
          background: "transparent",
          border: "1px solid rgba(96,165,250,0.2)",
        }}
        aria-hidden="true"
      />
      {/* Core: dark metallic charged tip */}
      <div
        ref={coreRef}
        className="pointer-events-none fixed top-0 left-0 z-[10003] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity, width, height, box-shadow",
          transition:
            "width 0.2s cubic-bezier(0.4,0,0.2,1), height 0.2s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease, box-shadow 0.3s ease",
          background:
            "radial-gradient(circle, #0f1318 0%, #1a1f28 50%, #2a3040 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
