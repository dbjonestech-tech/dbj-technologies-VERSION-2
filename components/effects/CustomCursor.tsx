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

  const updateStyles = useCallback(() => {
    const core = coreRef.current;
    const halo = haloRef.current;
    if (!core || !halo) return;

    // Halo: gentle trailing lerp
    haloPos.current.x += (posRef.current.x - haloPos.current.x) * 0.18;
    haloPos.current.y += (posRef.current.y - haloPos.current.y) * 0.18;

    const hovering = hoveringRef.current;
    const visible = visibleRef.current;

    // Core: instant tracking, 5px default, 4px on hover (tighter)
    const coreSize = hovering ? 4 : 5;
    const coreHalf = coreSize / 2;
    core.style.transform = `translate(${posRef.current.x - coreHalf}px, ${posRef.current.y - coreHalf}px)`;
    core.style.width = `${coreSize}px`;
    core.style.height = `${coreSize}px`;
    core.style.opacity = visible ? "1" : "0";
    core.style.boxShadow = hovering
      ? "0 0 6px 2px rgba(191, 207, 232, 0.7), 0 0 12px 4px rgba(147, 175, 220, 0.3)"
      : "0 0 4px 1px rgba(191, 207, 232, 0.5), 0 0 8px 2px rgba(147, 175, 220, 0.15)";

    // Halo: soft trailing presence, 18px default, 14px on hover (tighter)
    const haloSize = hovering ? 14 : 18;
    const haloHalf = haloSize / 2;
    halo.style.transform = `translate(${haloPos.current.x - haloHalf}px, ${haloPos.current.y - haloHalf}px)`;
    halo.style.width = `${haloSize}px`;
    halo.style.height = `${haloSize}px`;
    halo.style.opacity = visible ? (hovering ? "0.35" : "0.2") : "0";

    rafRef.current = requestAnimationFrame(updateStyles);
  }, []);

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMove = (e: MouseEvent) => {
      visibleRef.current = true;
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };

    const handleEnter = () => { visibleRef.current = true; };
    const handleLeave = () => { visibleRef.current = false; };

    const handleHoverStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']")
      ) {
        hoveringRef.current = true;
      }
    };

    const handleHoverEnd = () => { hoveringRef.current = false; };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseenter", handleEnter);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseover", handleHoverStart, { passive: true });
    document.addEventListener("mouseout", handleHoverEnd, { passive: true });

    rafRef.current = requestAnimationFrame(updateStyles);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
    };
  }, [updateStyles]);

  return (
    <>
      {/* Halo: soft trailing presence */}
      <div
        ref={haloRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity",
          transition: "width 0.25s ease, height 0.25s ease, opacity 0.3s ease",
          background: "radial-gradient(circle, rgba(186, 203, 230, 0.5) 0%, rgba(147, 175, 220, 0.12) 50%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* Core: precise bright point */}
      <div
        ref={coreRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block rounded-full"
        style={{
          willChange: "transform, opacity",
          transition: "width 0.15s ease, height 0.15s ease, opacity 0.2s ease, box-shadow 0.25s ease",
          background: "radial-gradient(circle, #e8edf5 0%, #c7d2e0 60%, #a8b8cc 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
