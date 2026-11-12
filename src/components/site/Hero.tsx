"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { Button } from "@/components/ui";

const ease = [0.23, 1, 0.32, 1] as const;
const lines = ["Farm food, straight", "from Lancashire."];

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);

  const rise = (i: number) =>
    reduce ? {} : { initial: { y: "110%" }, animate: { y: "0%" }, transition: { duration: 1.2, delay: 0.35 + i * 0.1, ease } };
  const fade = (d: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: d, ease } };

  return (
    <section id="top" ref={ref} className="px-3 pb-3 pt-[76px] md:px-5 md:pb-5 lg:pt-20">
      <motion.div
        className="relative isolate flex min-h-[calc(100svh-88px)] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-forest text-on-forest md:min-h-[calc(100svh-96px)] lg:min-h-[calc(100svh-100px)]"
        initial={reduce ? false : { clipPath: "inset(6% 4% 0% 4% round 24px)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 24px)" }}
        transition={{ duration: 1.4, ease }}
      >
        <motion.div className="absolute inset-0 -z-10" style={{ y }}>
          <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.14 }} animate={{ scale: 1 }} transition={{ duration: 2.6, ease }}>
            <Image
              src="/images/hero.webp"
              alt="Lancashire farmland at sunrise, with a delivery van on a lane between green fields"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[60%_50%]"
            />
          </motion.div>
        </motion.div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(16_37_27/0.35)_0%,rgb(16_37_27/0)_30%,rgb(16_37_27/0)_45%,rgb(16_37_27/0.8)_100%)]" />

        <div className="px-5 pb-6 pt-20 md:px-10 md:pb-10">
          <motion.p className="mb-6 inline-flex items-center gap-2 text-small font-medium text-on-forest/90" {...fade(0.3)}>
            <MapPin aria-hidden weight="fill" className="size-4 text-accent" />
            Lancashire, UK
          </motion.p>
          <h1 className="text-hero">
            {lines.map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.08em]">
                <motion.span className="block" {...rise(i)}>
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <div className="mt-8 flex flex-col gap-6 border-t border-white/20 pt-6 md:flex-row md:items-center md:justify-between">
            <motion.p className="max-w-[42ch] text-lead text-on-forest/85" {...fade(0.7)}>
              Order from growers near you. We deliver to your door and pass the surplus to local food groups.
            </motion.p>
            <motion.div className="flex flex-wrap gap-3" {...fade(0.8)}>
              <Button href="#join" variant="accent" className="pl-6">Join the waitlist</Button>
              <Button href="#how" variant="glass" arrow={false}>See how it works</Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
