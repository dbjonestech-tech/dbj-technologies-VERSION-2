"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] } }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
