"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
        </div>

        <h1 className="font-display text-3xl font-bold mb-3">
          Something Went Wrong
        </h1>
        <p className="text-text-secondary leading-relaxed mb-8">
          An unexpected error occurred. The issue has been logged and is
          being investigated. Please try again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
          <Link href="/" className="btn-outline inline-flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-xs text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
