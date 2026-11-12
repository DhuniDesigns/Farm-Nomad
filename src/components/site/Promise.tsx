"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const lines = ["Picked this week.", "Packed at the farm.", "Driven by a neighbour.", "Nothing left to waste."];

/** Each line lights up as it reaches the middle of the screen. */
export function PromiseLines() {
  return (
    <section className="gutter py-24 md:py-40" aria-label="What FarmNomad promises">
      <div className="wrap">
        {lines.map((l) => (
          <Line key={l} text={l} />
        ))}
      </div>
    </section>
  );
}

function Line({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "start 45%"] });
  const opacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.14, 1]);
  const x = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-24, 0]);
  return (
    <motion.p
      ref={ref}
      style={{ opacity, x }}
      className="border-b border-line py-4 font-display text-[clamp(2.5rem,1rem+5.4vw,6.75rem)] font-medium leading-[1] tracking-[-0.05em] md:py-6"
    >
      {text}
    </motion.p>
  );
}
