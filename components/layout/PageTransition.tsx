"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  /* `initial={{ opacity: 0 }}` SSRs as `style="opacity:0"` on the wrapper,
     which hides the entire page during the hydration window. On the
     homepage that produces a blank period after CSS loads but before
     framer-motion finishes hydrating — long enough to read as a flash.
     Suppress the initial state on the very first render and turn it on
     after mount, so subsequent in-app navigations still get the fade. */
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={hasMounted ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
