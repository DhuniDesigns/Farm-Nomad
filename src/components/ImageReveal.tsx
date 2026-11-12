"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Photo frame that opens from the bottom the first time it scrolls into view,
 * while the picture inside settles from a slight zoom. Runs once; reduced motion shows it as is.
 */
export function ImageReveal({ children, className, delay = 0, radius = 24 }: { children: ReactNode; className?: string; delay?: number; radius?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={cn("relative overflow-hidden", className)}>{children}</div>;
  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{ clipPath: `inset(18% 0% 0% 0% round ${radius}px)` }}
      whileInView={{ clipPath: `inset(0% 0% 0% 0% round ${radius}px)` }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1], delay }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ transform: "scale(1.12)" }}
        whileInView={{ transform: "scale(1)" }}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1], delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
