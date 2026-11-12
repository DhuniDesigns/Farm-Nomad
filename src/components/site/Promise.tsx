"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState, type PointerEvent } from "react";

const lines = [
  { text: "Picked this week.", src: "/images/harvest-hands.webp", alt: "Hands holding freshly pulled chard and carrots" },
  { text: "Packed at the farm.", src: "/images/step-pack-wide.webp", alt: "Two people packing vegetables into boxes in a stone barn" },
  { text: "Driven by a neighbour.", src: "/images/step-load-wide.webp", alt: "A driver loading a crate into a green van at sunset" },
  { text: "Nothing left to waste.", src: "/images/bag-cut.webp", alt: "A tote bag of surplus vegetables" },
];

/**
 * Each line lights up as it reaches the middle of the screen.
 * On a computer, hovering a line shows a small photo that trails the pointer on a spring.
 */
export function PromiseLines() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 });
  const rotate = useSpring(useTransform(mx, (v) => (box.current ? ((v / box.current.offsetWidth) - 0.5) * 10 : 0)), { stiffness: 200, damping: 20 });

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !box.current) return;
    const r = box.current.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <section className="gutter py-24 md:py-40" aria-label="What FarmNomad promises">
      <div ref={box} className="wrap relative" onPointerMove={move} onPointerLeave={() => setHover(null)}>
        {lines.map((l, i) => (
          <Line key={l.text} text={l.text} dim={hover !== null && hover !== i} onEnter={() => setHover(i)} />
        ))}

        {!reduce && (
          <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden [@media(hover:hover)]:block" style={{ x, y, rotate }}>
            <AnimatePresence>
              {hover !== null && (
                <motion.div
                  key={hover}
                  className="absolute -left-32 -top-40 h-64 w-52 overflow-hidden rounded-[18px] bg-forest shadow-[0_30px_60px_-20px_rgb(16_37_27/0.5)]"
                  initial={{ opacity: 0, transform: "scale(0.85)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: "scale(0.9)", transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Image src={lines[hover].src} alt="" fill sizes="208px" className={lines[hover].src.includes("-cut") ? "object-contain p-6" : "object-cover"} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Line({ text, dim, onEnter }: { text: string; dim: boolean; onEnter: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "start 45%"] });
  const opacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.14, 1]);
  const x = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-24, 0]);
  return (
    <motion.div style={{ opacity, x }} className="border-b border-line">
      <p
        ref={ref}
        onPointerEnter={onEnter}
        className="py-4 font-display text-[clamp(2.5rem,1rem+5.4vw,6.75rem)] font-medium leading-[1] tracking-[-0.05em] transition-[opacity,transform] duration-300 ease-[var(--ease-out)] md:py-6 [@media(hover:hover)]:hover:translate-x-3"
        style={{ opacity: dim ? 0.25 : 1 }}
      >
        {text}
      </p>
    </motion.div>
  );
}
