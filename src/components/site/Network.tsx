"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Check, Plant, Truck, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { cn } from "@/lib/cn";

const ease = [0.23, 1, 0.32, 1] as const;

// Pins sit on the photo in percentages so they hold their place at every width.
const pins = [
  { x: 14, y: 20, icon: Plant, label: "Hollins Farm", note: "12 veg boxes packed" },
  { x: 54, y: 58, icon: Truck, label: "Van 3", note: "2 drops left" },
  { x: 80, y: 28, icon: HandHeart, label: "St Mary's food bank", note: "Surplus claimed" },
];

const steps = ["Ordered", "Packed", "On the way", "Delivered"];

export function Network() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -25% 0px" });
  const reduce = useReducedMotion();
  const on = inView || !!reduce;

  return (
    <section className="gutter bg-forest py-24 text-on-forest md:py-36">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end">
          <h2 className="max-w-[13ch] text-h2">Every order, from the gate to your door.</h2>
          <p className="text-lead text-on-forest-muted">Farmers, drivers and buyers follow the same live order, so nothing sits waiting in a barn.</p>
        </div>

        <div ref={ref} className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] sm:aspect-[16/11] lg:col-span-8 lg:aspect-auto lg:min-h-[640px]">
            <Image
              src="/images/story-wheat.webp"
              alt="Aerial view of a farmer walking through a golden wheat field"
              fill
              sizes="(min-width: 1024px) 62vw, 95vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-forest/25" />

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
              <motion.path
                d="M14 20 C 26 44, 40 60, 54 58 S 72 34, 80 28"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="0.5"
                strokeDasharray="1.4 1.2"
                vectorEffect="non-scaling-stroke"
                style={{ strokeWidth: 2 }}
                initial={{ pathLength: 0 }}
                animate={on ? { pathLength: 1 } : {}}
                transition={{ duration: 2.2, ease, delay: 0.3 }}
              />
            </svg>

            {pins.map((p, i) => (
              <motion.div
                key={p.label}
                className="absolute"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={on ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, ease, delay: 0.5 + i * 0.6 }}
              >
                <span className="absolute -left-2 -top-2 grid size-4 place-items-center">
                  <span className="absolute size-4 animate-ping rounded-full bg-accent/50 motion-reduce:animate-none" />
                  <span className="relative size-2.5 rounded-full bg-accent ring-2 ring-forest" />
                </span>
                <div
                  className={cn(
                    "absolute top-4 flex items-center gap-2.5 whitespace-nowrap rounded-2xl bg-forest/70 py-2 pl-2 pr-3.5 backdrop-blur-md",
                    p.x > 70 ? "right-0" : "-left-3",
                  )}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-white/10">
                    <p.icon aria-hidden className="size-4 text-accent" />
                  </span>
                  <span className="grid leading-tight">
                    <span className="text-small font-medium">{p.label}</span>
                    <span className="text-label text-on-forest-muted">{p.note}</span>
                  </span>
                </div>
              </motion.div>
            ))}

            <span className="absolute bottom-4 left-4 rounded-full bg-forest/60 px-3 py-1.5 font-mono text-label text-on-forest-muted backdrop-blur-md">
              Example route, Preston to Garstang
            </span>
          </div>

          <div className="grid gap-4 lg:col-span-4">
            <article className="rounded-[var(--radius-card)] bg-forest-raised p-6">
              <div className="flex items-center justify-between">
                <p className="text-small text-on-forest-muted">Order FN-2041</p>
                <p className="font-mono text-label text-accent">On the way</p>
              </div>
              <p className="mt-4 font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] tabular">16:40</p>
              <p className="mt-1 text-small text-on-forest-muted">Expected at your door</p>
              <ol className="mt-7 grid grid-cols-4 gap-1.5">
                {steps.map((s, i) => (
                  <li key={s} className="grid gap-2.5">
                    <span className="h-1 overflow-hidden rounded-full bg-white/12">
                      <motion.span
                        className="block h-full rounded-full bg-accent"
                        initial={{ width: "0%" }}
                        animate={on && i < 3 ? { width: i === 2 ? "60%" : "100%" } : {}}
                        transition={{ duration: 0.7, ease, delay: 0.8 + i * 0.4 }}
                      />
                    </span>
                    <span className={cn("text-label", i < 3 ? "text-on-forest" : "text-on-forest-muted")}>{s}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="rounded-[var(--radius-card)] bg-forest-raised p-6">
              <p className="text-small text-on-forest-muted">In this box</p>
              <ul className="mt-4 grid gap-3">
                {[
                  ["/images/carrots-cut.webp", "Carrots, 1 kg", "Hollins Farm"],
                  ["/images/eggs-cut.webp", "Free-range eggs, 6", "Moss Lane Farm"],
                  ["/images/strawberries-cut.webp", "Strawberries, 400 g", "Ribble Fruit"],
                ].map(([src, name, farm]) => (
                  <li key={name} className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/[0.07]">
                      <Image src={src} alt="" width={80} height={80} className="size-9 object-contain" />
                    </span>
                    <span className="grid flex-1 leading-tight">
                      <span className="text-small font-medium">{name}</span>
                      <span className="text-label text-on-forest-muted">{farm}</span>
                    </span>
                    <Check aria-hidden weight="bold" className="size-4 text-accent" />
                  </li>
                ))}
              </ul>
            </article>

            <article className="flex items-center gap-4 rounded-[var(--radius-card)] bg-accent p-6 text-on-accent">
              <HandHeart aria-hidden weight="duotone" className="size-10 shrink-0" />
              <p className="text-body font-medium">Unsold stock from this route goes to St Mary&apos;s food bank.</p>
            </article>
          </div>
        </div>
        <p className="mt-4 text-small text-on-forest-muted">An example of the order view in the FarmNomad app. Farm names are illustrative.</p>
      </div>
    </section>
  );
}
