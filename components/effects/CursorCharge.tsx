"use client";

import { useEffect, useRef } from "react";

// Native arrow hotspot offset to align with the visible tip.
const TIP_X = 1;
const TIP_Y = 3;
const DOT_HALF = 1.5; // half of 3px idle size

export function CursorCharge() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const posRef = useRef({ x: -100, y: -100 });
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);
  const inTextRef = useRef(false);

  useEffect(() => {
    // Reduced motion — bail entirely, native cursor is enough
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch device — bail
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    // Not a fine pointer — bail
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const pulse = pulseRef.current;
    if (!dot || !pulse) return;

    /* ── rAF position loop — zero React re-renders ── */
    const frame = () => {
      const tx = posRef.current.x + TIP_X - DOT_HALF;
      const ty = posRef.current.y + TIP_Y - DOT_HALF;
      dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      pulse.style.transform = `translate3d(${tx - 6}px,${ty - 6}px,0)`;
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    /* ── Mouse tracking ── */
    const onMove = (e: MouseEvent) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        dot.classList.remove("opacity-0");
        dot.classList.add("opacity-100");
      }
    };
    const onEnter = () => {
      visibleRef.current = true;
      dot.classList.remove("opacity-0");
      dot.classList.add("opacity-100");
    };
    const onLeave = () => {
      visibleRef.current = false;
      dot.classList.remove("opacity-100");
      dot.classList.add("opacity-0");
    };

    /* ── Interactive element detection ── */
    const isInteractive = (el: HTMLElement) =>
      el.closest("a,button,[role='button'],[data-cursor-hover],summary,label[for],.glass-card-hover,.btn-primary,.btn-outline");

    const isText = (el: HTMLElement) =>
      el.closest("input:not([type='submit']):not([type='button']):not([type='reset']),textarea,select,[contenteditable='true']");

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement;
      if (isText(t)) {
        inTextRef.current = true;
        hoveringRef.current = false;
        dot.classList.add("opacity-0");
        dot.classList.remove("opacity-100");
      } else {
        inTextRef.current = false;
        if (isInteractive(t)) {
          hoveringRef.current = true;
          dot.classList.add("cursor-dot-hover");
        }
      }
    };
    const onOut = (e: Event) => {
      const rel = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!rel || !isInteractive(rel)) {
        hoveringRef.current = false;
        dot.classList.remove("cursor-dot-hover");
      }
      if (!rel || !isText(rel)) {
        inTextRef.current = false;
        if (visibleRef.current) {
          dot.classList.remove("opacity-0");
          dot.classList.add("opacity-100");
        }
      }
    };

    /* ── Click pulse — pure CSS animation, no drawing ── */
    const onDown = () => {
      if (inTextRef.current) return;
      // Restart the CSS animation by removing then re-adding class
      pulse.classList.remove("cursor-pulse-active");
      // Force reflow so the browser recognises the re-add
      void pulse.offsetWidth;
      pulse.classList.add("cursor-pulse-active");
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.addEventListener("mousedown", onDown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <>
      {/* Dot — 3px solid charcoal at cursor tip */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block
                   h-[3px] w-[3px] rounded-full bg-[#3a3a40] opacity-0
                   shadow-[0_0_1.5px_0.5px_rgba(190,190,195,0.35)]
                   transition-[width,height,box-shadow] duration-200 ease-out
                   [will-change:transform]"
        style={{ /* idle size set via className; hover overrides via .cursor-dot-hover */ }}
      />
      {/* Pulse ring — hidden until click triggers .cursor-pulse-active */}
      <div
        ref={pulseRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block
                   h-[15px] w-[15px] rounded-full
                   border border-[rgba(180,180,185,0.5)]
                   opacity-0
                   [will-change:transform,scale,opacity]"
      />
    </>
  );
}
