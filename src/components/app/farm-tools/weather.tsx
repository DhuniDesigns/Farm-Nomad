"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CheckCircle, Clock, CloudRain, Drop, Snowflake, Thermometer, Warning, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { CropAdvice, FrostRisk, PlantingMethod, WeatherConditions } from "@/lib/types/api";
import { Pill, Skeleton, type Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const frostMeta: Record<FrostRisk, { label: string; tone: Tone; hint: string }> = {
  NONE: { label: "None", tone: "green", hint: "No frost expected" },
  LOW: { label: "Low", tone: "blue", hint: "Unlikely, but cover tender plants" },
  MEDIUM: { label: "Medium", tone: "amber", hint: "Frost possible this week" },
  HIGH: { label: "High", tone: "red", hint: "Frost likely: protect anything tender" },
};

export const methodLabel: Record<PlantingMethod, string> = { SOW_INDOORS: "Sow indoors", SOW_OUTDOORS: "Sow outdoors", PLANT_OUT: "Plant out" };

const rainWord = (mm: number) => (mm >= 5 ? "Wet day ahead" : mm >= 1 ? "Some rain" : "Dry");
const SCALE_MAX = 20;

/** Conditions widget: soil at 6 cm (with the temperatures crops need), frost risk, rain, air now. */
export function ConditionsWidget({ c, thresholds }: { c?: WeatherConditions; thresholds: { temp: number; crop: string }[] }) {
  if (!c)
    return (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  const f = frostMeta[c.frostRisk];
  const pos = (t: number) => `${Math.min(100, Math.max(0, (t / SCALE_MAX) * 100))}%`;
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
      <Tile icon={<Thermometer weight="duotone" className="size-4" />} label="Soil at 6 cm" className="sm:col-span-2 lg:col-span-1">
        <dd className="num font-display text-[34px] font-medium leading-none tracking-[-0.03em]">{c.soilTemp6cm.toFixed(1)}°C</dd>
        {/* Where today's soil sits against what crops need */}
        <div className="relative mt-5 h-8" aria-label={`Soil is ${c.soilTemp6cm}°C`}>
          <div className="absolute inset-x-0 top-1 h-1.5 rounded-full bg-[linear-gradient(90deg,#9ec5e8,#cfe3a8_40%,#f2c46b_75%,#e8956b)] opacity-70 dark:opacity-50" />
          {thresholds.map((t) => (
            <span key={t.temp} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: pos(t.temp) }} title={`${t.crop} needs ${t.temp}°C`}>
              <span className={cn("h-3.5 w-px", c.soilTemp6cm >= t.temp ? "bg-app-text/50" : "bg-app-faint/60")} />
              <span className={cn("num mt-0.5 whitespace-nowrap text-[10px]", c.soilTemp6cm >= t.temp ? "text-app-muted" : "text-app-faint")}>{t.temp}°</span>
            </span>
          ))}
          <motion.span
            className="absolute top-[-3px] size-3.5 -translate-x-1/2 rounded-full bg-app-text shadow-[0_0_0_3px_var(--a-panel)]"
            initial={{ left: "0%" }}
            animate={{ left: pos(c.soilTemp6cm) }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        <p className="mt-1 text-ui-sm text-app-faint">Marks show the soil temperature crops in the list below need.</p>
      </Tile>
      <Tile icon={<Snowflake weight="duotone" className="size-4" />} label="Frost risk">
        <dd>
          <Pill tone={f.tone}>{f.label}</Pill>
        </dd>
        <p className="mt-2 text-ui-sm text-app-muted">{f.hint}</p>
        {c.minTempNext7d !== undefined && (
          <p className="mt-1 text-ui-sm text-app-faint">
            Coldest night: <span className="num">{c.minTempNext7d.toFixed(1)}°C</span>
          </p>
        )}
      </Tile>
      <Tile icon={<CloudRain weight="duotone" className="size-4" />} label="Rain">
        <dd className="num font-display text-[26px] font-medium leading-none tracking-[-0.03em]">
          {c.rainNext24hMm.toFixed(1)}
          <span className="ml-1 text-[14px] font-normal text-app-muted">mm</span>
        </dd>
        <p className="mt-2 text-ui-sm text-app-muted">{rainWord(c.rainNext24hMm)} · next 24 h</p>
        {c.rainNext7dMm !== undefined && (
          <p className="mt-1 text-ui-sm text-app-faint">
            <span className="num">{c.rainNext7dMm.toFixed(0)} mm</span> over 7 days
          </p>
        )}
      </Tile>
      <Tile icon={<Drop weight="duotone" className="size-4" />} label="Air now">
        <dd className="num font-display text-[26px] font-medium leading-none tracking-[-0.03em]">{c.airTemp !== undefined ? `${c.airTemp.toFixed(1)}°C` : "–"}</dd>
        {c.observedAt && <p className="mt-2 text-ui-sm text-app-faint">Updated {new Date(c.observedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>}
      </Tile>
    </dl>
  );
}

function Tile({ icon, label, children, className }: { icon: ReactNode; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]", className)}>
      <dt className="mb-3 flex items-center gap-1.5 text-ui-sm text-app-muted">
        <span className="text-app-accent">{icon}</span> {label}
      </dt>
      {children}
    </div>
  );
}

/** 7-day forecast. Only rendered when /conditions returns daily arrays (not in v1 of the API). */
export function ForecastRow({ daily }: { daily: NonNullable<WeatherConditions["daily"]> }) {
  return (
    <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0" aria-label="7-day forecast">
      {daily.slice(0, 7).map((d) => (
        <li key={d.date} className="min-w-[88px] rounded-xl p-3 text-center shadow-[0_0_0_1px_var(--a-line)]">
          <p className="text-ui-sm text-app-muted">{new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" })}</p>
          <p className="num mt-1.5 font-medium">{Math.round(d.tempMax)}°</p>
          <p className={cn("num text-ui-sm", d.tempMin <= 1 ? "text-app-blue" : "text-app-faint")}>{Math.round(d.tempMin)}°</p>
          <p className="num mt-1 text-[11px] text-app-faint">{d.rainMm.toFixed(0)} mm</p>
        </li>
      ))}
    </ul>
  );
}

/** One crop: ready or not, and exactly why. */
export function CropCard({ a, ready, soil }: { a: CropAdvice; ready: boolean; soil?: number }) {
  const warm = a.minSoilTemp !== undefined && soil !== undefined ? soil >= a.minSoilTemp : undefined;
  return (
    <li className="flex flex-col rounded-xl bg-app-panel p-4 shadow-[0_0_0_1px_var(--a-line)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {ready ? <CheckCircle weight="fill" className="size-4 shrink-0 text-app-accent" /> : <Clock weight="fill" className="size-4 shrink-0 text-app-faint" />}
          <p className="truncate font-medium">{a.crop}</p>
        </div>
        {a.method && <span className="shrink-0 rounded-full bg-app-hover px-2 py-0.5 text-[11px] font-medium text-app-muted">{methodLabel[a.method]}</span>}
      </div>
      {a.minSoilTemp !== undefined && (
        <p className={cn("mt-1.5 text-ui-sm", warm === false ? "text-app-red" : "text-app-faint")}>
          Needs <span className="num">{a.minSoilTemp}°C</span> soil{warm !== undefined && ` · ${warm ? "warm enough" : "too cold"}`}
        </p>
      )}
      {(a.blockers.length > 0 || a.warnings.length > 0) && (
        <ul className="mt-3 grid gap-1.5 text-ui-sm">
          {a.blockers.map((b) => (
            <li key={b} className="flex gap-2 text-app-text">
              <XCircle weight="fill" className="mt-0.5 size-3.5 shrink-0 text-app-red" />
              {b}
            </li>
          ))}
          {a.warnings.map((w) => (
            <li key={w} className="flex gap-2 text-app-muted">
              <Warning weight="fill" className="mt-0.5 size-3.5 shrink-0 text-app-amber" />
              {w}
            </li>
          ))}
        </ul>
      )}
      {a.notes && <p className="mt-3 text-ui-sm text-app-faint">{a.notes}</p>}
    </li>
  );
}
