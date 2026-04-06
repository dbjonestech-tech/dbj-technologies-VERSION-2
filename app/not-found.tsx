"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { GradientBlob } from "@/components/effects/GradientBlob";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <GradientBlob className="-top-40 -right-40" />
      <GradientBlob className="-bottom-40 -left-40" colors={["#8b5cf6", "#3b82f6", "#06b6d4"]} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <span className="font-display text-[8rem] font-bold leading-tight text-gradient md:text-[10rem]">
            404
          </span>
        </motion.div>

        <h1 className="font-display text-3xl font-bold mb-3">
          Page Not Found
        </h1>
        <p className="text-text-secondary leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link href="/contact" className="btn-outline inline-flex items-center gap-2">
            Contact Us
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
