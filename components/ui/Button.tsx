"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variants = {
  primary: "btn-primary",
  outline: "btn-outline",
  ghost: "text-text-secondary hover:text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 transition-all",
};

const sizes = {
  sm: "text-sm px-5 py-2",
  md: "text-sm px-8 py-3.5",
  lg: "text-base px-10 py-4",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(variants[variant], sizes[size], disabled && "opacity-50 cursor-not-allowed", className)}
    >
      {children}
    </motion.button>
  );
}
