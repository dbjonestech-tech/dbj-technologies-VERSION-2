"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  /* The wrapper element must render identically on server and client.
     A prior version returned a Fragment for reduced-motion users, so
     the motion.div existed in SSR HTML but disappeared on the first
     client render. That wrapper-vs-no-wrapper structural mismatch
     desynced React 19's reconciler from the DOM and produced
     NotFoundError: insertBefore / removeChild crashes on later commits
     across /, /about, /contact, /pathlight.
     `initial={false}` short-circuits framer-motion's animation on
     first mount and for reduced-motion users, so the page paints its
     final state immediately. Subsequent in-app navigations remount via
     `key={pathname}` and animate normally. */
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const shouldAnimate = hasMounted && !prefersReducedMotion;

  return (
    <motion.div
      key={pathname}
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldAnimate
          ? { duration: 0.3, ease: [0.25, 1, 0.5, 1] }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}
