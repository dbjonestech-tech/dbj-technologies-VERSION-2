"use client";

import { useEffect, useRef, useCallback } from "react";

export function CustomCursor() {
  const glowRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const renderPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);

  const updateStyles = useCallback(() => {
    const glow = glowRef.current;
    if (!glow) return;

    // Smooth follow (lerp)
    renderPos.current.x += (posRef.current.x - renderPos.current.x) * 0.12;
    renderPos.current.y += (posRef.current.y - renderPos.current.y) * 0.12;

    const size = hoveringRef.current ? 56 : 40;
    const half = size / 2;

    glow.style.transform = `translate(${renderPos.current.x - half}px, ${renderPos.current.y - half}px)`;
    glow.style.width = `${size}px`;
    glow.style.height = `${size}px`;
    glow.style.opacity = visibleRef.current ? (hoveringRef.current ? "0.6" : "0.4") : "0";

    rafRef.current = requestAnimationFrame(updateStyles);
  }, []);

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    document.body.classList.add("custom-cursor-active");

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
        target.closest("[role='button']") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select")
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
      document.body.classList.remove("custom-cursor-active");
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
    };
  }, [updateStyles]);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block rounded-full blur-2xl"
      style={{
        willChange: "transform",
        transition: "width 0.3s, height 0.3s, opacity 0.3s",
        background: "linear-gradient(135deg, #22d3ee, #3b82f6, #8b5cf6)",
      }}
      aria-hidden="true"
    />
  );
}
