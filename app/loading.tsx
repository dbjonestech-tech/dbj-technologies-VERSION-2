"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary" role="status" aria-label="Loading page">
      {/* Central loader */}
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo mark */}
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-2xl border-2 border-accent-blue/20" />
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-accent-blue"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-display text-xl font-bold text-gradient">D</span>
        </motion.div>

        {/* Loading bar */}
        <div className="h-0.5 w-48 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <span className="font-mono text-xs uppercase tracking-[0.25em] text-text-muted">
          Loading
        </span>
      </div>
    </div>
  );
}
