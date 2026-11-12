"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";

const steps = [
  {
    title: "The farmer lists it",
    body: "A photo from the field, a price and a best-before date. The listing is live for buyers nearby within minutes.",
    tags: ["Photo listings", "Stock and best-before", "Set your own price"],
    src: "/images/step-list.webp",
    alt: "A farmer kneeling in a carrot field, photographing a bunch of carrots with his phone",
  },
  {
    title: "Orders are packed at the farm",
    body: "Orders from homes, kitchens and shops arrive together, so the farm packs once for every buyer on the route.",
    tags: ["One pick list", "Grouped by route", "Labels per order"],
    src: "/images/step-pack.webp",
    alt: "Two farm workers packing vegetables into cardboard boxes in a barn",
  },
  {
    title: "A local driver collects",
    body: "Drivers pick up runs near them, see each stop in order and confirm every collection on their phone.",
    tags: ["Nearby runs", "Stops in order", "Proof of collection"],
    src: "/images/step-load.webp",
    alt: "A driver loading produce crates into a green van in a farmyard at sunset",
  },
  {
    title: "It arrives at your door",
    body: "Follow the van from the farm gate to your street, then rate the farm when the box arrives.",
    tags: ["Live tracking", "Doorstep delivery", "Farm ratings"],
    src: "/images/step-door.webp",
    alt: "A smiling customer taking a box of vegetables from a driver at her front door",
  },
];

const ease = [0.23, 1, 0.32, 1] as const;

/** Pinned card. Scrolling moves through the four steps; the segments underneath show where you are. */
export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(steps.length - 1, Math.floor(v * steps.length))));
  const s = steps[active];

  return (
    <section id="how" ref={ref} className="relative h-[420svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col p-3 pt-24 md:p-5 md:pt-28">
        <div className="relative isolate flex flex-1 flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-forest text-on-forest">
          <AnimatePresence initial={false}>
            <motion.div
              key={active}
              className="absolute inset-0 -z-10"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease }}
            >
              <Image src={s.src} alt={s.alt} fill sizes="100vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(16_37_27/0.45)_0%,rgb(16_37_27/0)_30%,rgb(16_37_27/0.15)_50%,rgb(16_37_27/0.85)_100%)]" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 md:p-8">
            <p className="text-small font-medium">How FarmNomad works</p>
            <p className="font-mono text-small tabular text-on-forest-muted">
              0{active + 1} / 0{steps.length}
            </p>
          </div>

          <div className="p-5 md:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease }}
              >
                <h2 className="max-w-[16ch] text-h2">{s.title}</h2>
                <p className="mt-5 max-w-[50ch] text-lead text-on-forest/85">{s.body}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <li key={t} className="rounded-full bg-white/12 px-3.5 py-1.5 text-small backdrop-blur-md">
                      {t}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 grid grid-cols-4 gap-2" aria-hidden>
              {steps.map((_, i) => (
                <Segment key={i} progress={scrollYProgress} index={i} count={steps.length} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Segment({ progress, index, count }: { progress: MotionValue<number>; index: number; count: number }) {
  const scaleX = useTransform(progress, [index / count, (index + 1) / count], [0, 1]);
  return (
    <span className="h-1 overflow-hidden rounded-full bg-white/20">
      <motion.span className="block h-full origin-left rounded-full bg-accent" style={{ scaleX }} />
    </span>
  );
}
