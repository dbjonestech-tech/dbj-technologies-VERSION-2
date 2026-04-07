"use client";

import { useEffect, useRef, useCallback } from "react";

export function CustomCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const haloPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);
  const pressedRef = useRef(false);

  const updateStyles = useCallback(() => {
    const core = coreRef.current;
    const halo = haloRef.current;
    if (!core || !halo) return;

    // Halo: smooth trailing lerp
    haloPos.current.x += (posRef.current.x - haloPos.current.x) * 0.12;
    haloPos.current.y += (posRef.current.y - haloPos.current.y) * 0.12;

    const hovering = hoveringRef.current;
    const visible = visibleRef.current;
    const pressed = pressedRef.current;

    // ── Core: dark metallic charged tip ──
    const coreSize = pressed ? 6 : hovering ? 10 : 8;
    const coreHalf = coreSize / 2;
    core.style.transform = `translate3d(${posRef.current.x - coreHalf}px, ${posRef.current.y - coreHalf}px, 0)`;
    core.style.width = `${coreSize}px`;
    core.style.height = `${coreSize}px`;
    core.style.opacity = visible ? "1" : "0";

    // Blue energy aura around dark core — intensifies on hover/press
    if (pressed) {
      core.style.boxShadow =
        "0 0 6px 2px rgba(147,197,253,0.85), 0 0 18px 5px rgba(59,130,246,0.5), 0 0 36px 8px rgba(59,130,246,0.2)";
    } else if (hovering) {
      core.style.boxShadow =
        "0 0 8px 2px rgba(96,165,250,0.7), 0 0 20px 6px rgba(59,130,246,0.35), 0 0 44px 12px rgba(59,130,246,0.15)";
    } else {
      core.style.boxShadow =
        "0 0 4px 1px rgba(96,165,250,0.35), 0 0 12px 3px rgba(59,130,246,0.15), 0 0 24px 6px rgba(59,130,246,0.06)";
    }

    // ── Halo: soft trailing energy field ──
    const haloSize = pressed ? 18 : hovering ? 26 : 34;
    const haloHalf = haloSize / 2;
    halo.style.transform = `translate3d(${haloPos.current.x - haloHalf}px, ${haloPos.current.y - haloHalf}px, 0)`;
    halo.style.width = `${haloSize}px`;
    halo.style.height = `${haloSize}px`;
    halo.style.opacity = visible
      ? pressed
        ? "0.45"
        : hovering
          ? "0.35"
          : "0.15"
      : "0";

    rafRef.current = requestAnimationFrame(updateStyles);
  }, []);

  useEffect(() => {
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
      el.closest("[data-cursor-hover]");

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
      {/* Halo: soft trailing energy field */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity, width, height",
          transition:
            "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.6) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Core: dark metallic charged tip with blue edge energy */}
      <div
        ref={coreRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity, width, height, box-shadow",
          transition:
            "width 0.2s cubic-bezier(0.4,0,0.2,1), height 0.2s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, box-shadow 0.3s ease",
          background:
            "radial-gradient(circle, #1c2028 0%, #2d3748 60%, #4b5563 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
