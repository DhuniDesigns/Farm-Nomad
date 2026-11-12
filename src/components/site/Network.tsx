"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Check, HandHeart, Plant, Truck } from "@phosphor-icons/react/dist/ssr";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

// The aerial photo is 1280 x 960. Everything on top of it uses the same coordinates.
const W = 1280;
const H = 960;
// Follows the lane in the photo, from the farm turning to the village by the church.
const ROUTE = "M 150 812 C 260 730, 330 660, 440 625 S 560 590, 600 582 S 760 520, 880 400 S 1080 220, 1185 168";

const stages = ["Ordered", "Packed", "On the way", "Delivered"] as const;

export function Network() {
  const reduce = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // The van drives as you scroll through the map.
  const { scrollYProgress } = useScroll({ target: mapRef, offset: ["start 75%", "end 35%"] });
  const p = useTransform(scrollYProgress, [0, 1], [0, 1], { clamp: true });
  const point = (v: number, axis: "x" | "y") => {
    const el = pathRef.current;
    if (!el) return axis === "x" ? 150 : 812;
    return el.getPointAtLength(el.getTotalLength() * v)[axis];
  };
  const vx = useTransform(p, (v) => point(reduce ? 0.5 : v, "x"));
  const vy = useTransform(p, (v) => point(reduce ? 0.5 : v, "y"));
  const trail = useTransform(p, (v) => (reduce ? 0.5 : v));

  const [prog, setProg] = useState(0);
  useMotionValueEvent(p, "change", (v) => setProg(Math.round(v * 100) / 100));
  const done = prog >= 0.97;
  const stage = done ? 3 : prog > 0.04 ? 2 : 1;
  const mins = Math.max(1, Math.round((1 - prog) * 26));

  return (
    <section className="gutter bg-forest py-24 text-on-forest md:py-36">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end">
          <h2 className="max-w-[13ch] text-h2">Follow your box from the gate to your door.</h2>
          <p className="text-lead text-on-forest-muted">Farmers, drivers and buyers all see the same live order, so nothing sits waiting in a barn.</p>
        </div>

        <div className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-12">
          <div ref={mapRef} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] lg:col-span-8">
            <Image src="/images/route-aerial.webp" alt="Aerial view of a lane through Lancashire fields, between a farm and a village church" fill sizes="(min-width: 1024px) 62vw, 95vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_40%,rgb(16_37_27/0.45))]" />

            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
              {/* the whole route, faint */}
              <path ref={pathRef} d={ROUTE} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="5" strokeDasharray="2 14" strokeLinecap="round" />
              {/* the part already driven */}
              <motion.path d={ROUTE} fill="none" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round" style={{ pathLength: trail }} />
              {/* the van */}
              <motion.g style={{ x: vx, y: vy }}>
                <circle r="30" fill="var(--color-accent)" opacity="0.25">
                  <animate attributeName="r" values="18;34;18" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle r="15" fill="var(--color-accent)" stroke="#10251B" strokeWidth="5" />
              </motion.g>
              {/* stops */}
              <circle cx="150" cy="812" r="10" fill="white" stroke="#10251B" strokeWidth="4" />
              <circle cx="1185" cy="168" r="10" fill={done ? "var(--color-accent)" : "white"} stroke="#10251B" strokeWidth="4" />
            </svg>

            <Pin x={200} y={150} icon={Plant} label="Hollins Farm" note="12 boxes packed" />
            <Pin x={1250} y={215} icon={HandHeart} label="St Mary's food bank" note={done ? "Surplus delivered" : "Surplus on board"} align="right" lit={done} />

            <span className="absolute bottom-3 left-3 rounded-full bg-forest/65 px-3 py-1.5 font-mono text-label text-on-forest-muted backdrop-blur-md">
              Example route · scroll to drive
            </span>
          </div>

          <div className="grid gap-4 lg:col-span-4">
            <article className="rounded-[var(--radius-card)] bg-forest-raised p-6" aria-live="polite">
              <div className="flex items-center justify-between">
                <p className="text-small text-on-forest-muted">Order FN-2041</p>
                <p className={cn("inline-flex items-center gap-1.5 font-mono text-label", done ? "text-accent" : "text-on-forest")}>
                  {done ? <Check aria-hidden weight="bold" className="size-3.5" /> : <Truck aria-hidden className="size-3.5" />}
                  {stages[stage]}
                </p>
              </div>
              <p className="mt-4 font-display text-[2.75rem] font-medium leading-none tracking-[-0.04em] tabular">
                {done ? "Delivered" : `${mins} min`}
              </p>
              <p className="mt-1 text-small text-on-forest-muted">{done ? "Left at the front door, 16:40" : "Until it reaches your door"}</p>
              <ol className="mt-7 grid grid-cols-4 gap-1.5">
                {stages.map((s, i) => (
                  <li key={s} className="grid gap-2.5">
                    <span className="h-1 overflow-hidden rounded-full bg-white/12">
                      <span
                        className="block h-full origin-left rounded-full bg-accent transition-transform duration-500 ease-[var(--ease-out)]"
                        style={{ transform: `scaleX(${i < stage ? 1 : i === stage && !done ? Math.min(1, prog * 1.05) : i <= stage ? 1 : 0})` }}
                      />
                    </span>
                    <span className={cn("text-label transition-colors duration-300", i <= stage ? "text-on-forest" : "text-on-forest-muted")}>{s}</span>
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

            <article className={cn("flex items-center gap-4 rounded-[var(--radius-card)] p-6 transition-colors duration-500", done ? "bg-accent text-on-accent" : "bg-forest-raised text-on-forest")}>
              <HandHeart aria-hidden weight="duotone" className="size-10 shrink-0" />
              <p className="text-body font-medium">
                {done ? "Unsold stock from this route reached St Mary's food bank." : "Unsold stock rides along to St Mary's food bank."}
              </p>
            </article>
          </div>
        </div>
        <p className="mt-4 text-small text-on-forest-muted">An example of the order view in the FarmNomad app. Farm names are illustrative.</p>
      </div>
    </section>
  );
}

function Pin({
  x,
  y,
  icon: Icon,
  label,
  note,
  align = "left",
  lit = false,
}: {
  x: number;
  y: number;
  icon: typeof Plant;
  label: string;
  note: string;
  align?: "left" | "right";
  lit?: boolean;
}) {
  return (
    <div className="absolute hidden sm:block" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
      <div
        className={cn(
          "absolute top-0 flex items-center gap-2.5 whitespace-nowrap rounded-2xl py-2 pl-2 pr-3.5 backdrop-blur-md transition-colors duration-500",
          align === "right" ? "right-0" : "left-0",
          lit ? "bg-accent text-on-accent" : "bg-forest/75 text-on-forest",
        )}
      >
        <span className={cn("grid size-8 place-items-center rounded-xl", lit ? "bg-forest/10" : "bg-white/10")}>
          <Icon aria-hidden className={cn("size-4", lit ? "text-forest" : "text-accent")} />
        </span>
        <span className="grid leading-tight">
          <span className="text-small font-medium">{label}</span>
          <span className={cn("text-label", lit ? "opacity-75" : "text-on-forest-muted")}>{note}</span>
        </span>
      </div>
    </div>
  );
}
