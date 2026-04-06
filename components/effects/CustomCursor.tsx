"use client";

import { useEffect, useRef, useCallback } from "react";

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const outerPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const clickingRef = useRef(false);
  const visibleRef = useRef(false);

  const updateStyles = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // Smooth follow for outer ring (lerp)
    outerPos.current.x += (posRef.current.x - outerPos.current.x) * 0.15;
    outerPos.current.y += (posRef.current.y - outerPos.current.y) * 0.15;

    const size = hoveringRef.current ? 48 : clickingRef.current ? 16 : 32;

    outer.style.transform = `translate(${outerPos.current.x - size / 2}px, ${outerPos.current.y - size / 2}px)`;
    outer.style.width = `${size}px`;
    outer.style.height = `${size}px`;
    outer.style.opacity = visibleRef.current ? "1" : "0";
    outer.style.borderColor = hoveringRef.current
      ? "rgba(59, 130, 246, 0.8)"
      : "rgba(255, 255, 255, 0.5)";
    outer.style.backgroundColor = hoveringRef.current
      ? "rgba(59, 130, 246, 0.05)"
      : "transparent";

    inner.style.transform = `translate(${posRef.current.x - 2}px, ${posRef.current.y - 2}px)`;
    inner.style.opacity = visibleRef.current ? "1" : "0";
    inner.style.width = hoveringRef.current ? "6px" : "4px";
    inner.style.height = hoveringRef.current ? "6px" : "4px";

    rafRef.current = requestAnimationFrame(updateStyles);
  }, []);

  useEffect(() => {
    // Only show on non-touch devices
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Activate cursor: none on body
    document.body.classList.add("custom-cursor-active");

    const handleMove = (e: MouseEvent) => {
      visibleRef.current = true;
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };

    const handleEnter = () => { visibleRef.current = true; };
    const handleLeave = () => { visibleRef.current = false; };
    const handleDown = () => { clickingRef.current = true; };
    const handleUp = () => { clickingRef.current = false; };

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
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseover", handleHoverStart, { passive: true });
    document.addEventListener("mouseout", handleHoverEnd, { passive: true });

    rafRef.current = requestAnimationFrame(updateStyles);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseenter", handleEnter);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
    };
  }, [updateStyles]);

  return (
    <>
      {/* Outer ring */}
      <div
        ref={outerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block mix-blend-difference"
        style={{ willChange: "transform", transition: "width 0.2s, height 0.2s, border-color 0.2s, background-color 0.2s" }}
        aria-hidden="true"
      >
        <div className="h-full w-full rounded-full border" />
      </div>

      {/* Inner dot */}
      <div
        ref={innerRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      >
        <div className="h-full w-full rounded-full bg-white" />
      </div>
    </>
  );
}
