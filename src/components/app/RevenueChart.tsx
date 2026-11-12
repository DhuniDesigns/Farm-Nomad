"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { gbp } from "./ui";

type Point = { date: string; value: number };

/**
 * Single-series area chart (dataviz skill: one series, so no legend; the card title names it).
 * 2px line, faint fill, recessive grid, crosshair + tooltip on hover, keyboard arrows move the readout.
 */
export function RevenueChart({ data, height = 220 }: { data: Point[]; height?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { t: 12, r: 8, b: 26, l: 44 };
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;

  const { line, area, xs, ys, ticks } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value)) * 1.12 || 1;
    const nice = Math.ceil(max / 25) * 25;
    const xs = data.map((_, i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw));
    const ys = data.map((d) => pad.t + ih - (d.value / nice) * ih);
    // Monotone-ish smoothing with short cubic handles.
    let line = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i] - xs[i - 1]) / 2.5;
      line += ` C ${xs[i - 1] + cx} ${ys[i - 1]}, ${xs[i] - cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    const area = `${line} L ${xs[xs.length - 1]} ${pad.t + ih} L ${xs[0]} ${pad.t + ih} Z`;
    const ticks = [0, 0.5, 1].map((f) => ({ y: pad.t + ih - f * ih, v: f * nice }));
    return { line, area, xs, ys, ticks };
  }, [data, iw, ih, pad.l, pad.t]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    let best = 0;
    xs.forEach((v, i) => Math.abs(v - x) < Math.abs(xs[best] - x) && (best = i));
    setHover(best);
  };

  const labelEvery = Math.ceil(data.length / 6);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const h = hover !== null ? data[hover] : null;

  return (
    <div ref={wrap} className="relative w-full min-w-0" style={{ height }}>
      {w > 0 && (<>
      <svg
        width={w}
        height={height}
        className="block touch-none select-none outline-none"
        role="img"
        aria-label={`Daily revenue, ${fmt(data[0].date)} to ${fmt(data[data.length - 1].date)}. Highest ${gbp(Math.max(...data.map((d) => d.value)))}.`}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((i) => Math.min(data.length - 1, (i ?? -1) + 1));
          if (e.key === "ArrowLeft") setHover((i) => Math.max(0, (i ?? data.length) - 1));
        }}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--a-accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--a-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={pad.l} x2={w - pad.r} y1={t.y} y2={t.y} stroke="var(--a-line)" strokeDasharray={t.v === 0 ? undefined : "2 4"} />
            <text x={pad.l - 8} y={t.y + 4} textAnchor="end" className="num fill-[var(--a-faint)] text-[11px]">
              £{Math.round(t.v)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.date} x={xs[i]} y={height - 6} textAnchor="middle" className="num fill-[var(--a-faint)] text-[11px]">
              {fmt(d.date)}
            </text>
          ) : null,
        )}
        <motion.path key={`a-${data.length}`} d={area} fill="url(#rev-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
        <motion.path
          key={`l-${data.length}`}
          d={line}
          fill="none"
          stroke="var(--a-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        />
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={xs[hover]} x2={xs[hover]} y1={pad.t} y2={pad.t + ih} stroke="var(--a-line-strong)" />
            <circle cx={xs[hover]} cy={ys[hover]} r="4.5" fill="var(--a-accent)" stroke="var(--a-panel)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg bg-app-panel px-2.5 py-1.5 shadow-pop"
          style={{ left: Math.min(Math.max(xs[hover] - 60, 0), w - 120), transform: `translateY(${Math.max(0, ys[hover] - 58)}px)` }}
        >
          <p className="num text-[13px] font-semibold">{gbp(h.value)}</p>
          <p className="text-ui-sm text-app-faint">{new Date(h.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
        </div>
      )}
      </>)}
    </div>
  );
}
