"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Figures as published by WRAP. Keep the sources line below in step if these change.
const stats = [
  { to: 10.7, decimals: 1, prefix: "", suffix: "m", unit: "tonnes", body: "of food wasted in the UK every year" },
  { to: 17, decimals: 0, prefix: "£", suffix: "bn", unit: "a year", body: "is what the edible part of that wasted food is worth" },
  { to: 3, decimals: 0, prefix: "", suffix: " in 10", unit: "tonnes", body: "are lost on farms and in food production, before food reaches a shop" },
];

/** The problem, stated plainly. Numbers count up once when the strip comes into view. */
export function Impact() {
  return (
    <section aria-labelledby="impact-title" className="gutter pt-24 md:pt-36">
      <div className="wrap">
        <h2 id="impact-title" className="max-w-[18ch] text-h2">
          Good food is going to waste before anyone gets to eat it.
        </h2>
        <dl className="mt-14 grid border-t border-line md:mt-20 md:grid-cols-3">
          {stats.map((s, i) => (
            <div key={s.body} className="border-b border-line py-8 md:border-b-0 md:py-10 md:pr-10 [&:not(:first-child)]:md:border-l [&:not(:first-child)]:md:pl-10">
              <dt className="sr-only">{s.body}</dt>
              <dd>
                <p className="font-display text-[clamp(3.25rem,2rem+3.6vw,5.5rem)] font-medium leading-none tracking-[-0.05em] tabular">
                  <Count {...s} delay={i * 0.12} />
                  <span className="ml-2 align-baseline text-[0.32em] tracking-[-0.02em] text-muted">{s.unit}</span>
                </p>
                <p className="mt-4 max-w-[30ch] text-lead text-muted">{s.body}</p>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 font-mono text-label text-muted">
          Source: WRAP. UK total and value, 2021. Farm and food production share from WRAP&apos;s food surplus and waste key facts, 2025.
        </p>
      </div>
    </section>
  );
}

function Count({ to, decimals, prefix, suffix, delay }: { to: number; decimals: number; prefix: string; suffix: string; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration: 1.4, delay, ease: [0.23, 1, 0.32, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, reduce, to, delay]);
  return (
    <span ref={ref} aria-label={`${prefix}${to}${suffix}`}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}
