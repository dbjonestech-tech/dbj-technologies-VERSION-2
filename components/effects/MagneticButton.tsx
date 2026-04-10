"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState("translate(0px, 0px)");
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setTransform(`translate(${x}px, ${y}px)`);
  }, [strength]);

  const handleLeave = useCallback(() => {
    setTransform("translate(0px, 0px)");
  }, []);

  if (isTouch) {
    return (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        transform,
        transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </button>
  );
}
