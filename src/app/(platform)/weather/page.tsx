"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowsClockwise, MapPin, Plant, Shovel, Hourglass } from "@phosphor-icons/react/dist/ssr";
import { useMeQuery } from "@/lib/api/farmnomad";
import { lookupPostcode, useConditionsQuery, usePlantingQuery, type Place } from "@/lib/api/weather.api";
import type { CropAdvice } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { ConditionsWidget, CropCard, ForecastRow } from "@/components/app/farm-tools/weather";
import { Button, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const KEY = "fn_weather_postcode";

/**
 * Weather & planting (spec §7.13, FARMER). Postcode → lat/lon via postcodes.io in the browser,
 * then conditions and planting advice from our API. The crop calendar lives in the AI service.
 */
export default function WeatherPage() {
  const { data: me } = useMeQuery();
  const [place, setPlace] = useState<Place | null>(null);
  const [input, setInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  async function go(pc: string, remember = true) {
    setLookupError(null);
    setLooking(true);
    try {
      const p = await lookupPostcode(pc);
      setPlace(p);
      setInput(p.postcode);
      if (remember) {
        try {
          window.localStorage.setItem(KEY, p.postcode);
        } catch {}
      }
    } catch (e) {
      setLookupError((e as Error).message);
    } finally {
      setLooking(false);
    }
  }

  // Start from the last postcode used here, else the farm's own postcode.
  useEffect(() => {
    if (place || !me) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {}
    const pc = saved ?? me.postcode;
    if (pc) go(pc, false);
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const at = place ? { lat: place.lat, lon: place.lon } : undefined;
  const { data: c, isFetching: f1, isError: e1, refetch: r1 } = useConditionsQuery(at!, { skip: !at });
  const { data: plan, isFetching: f2, isError: e2, refetch: r2 } = usePlantingQuery(at!, { skip: !at });

  // Soil-temperature marks for the scale: the distinct temperatures crops in this list need.
  const thresholds = useMemo(() => {
    const all: CropAdvice[] = [...(plan?.readyToPlantOut ?? []), ...(plan?.readyToSow ?? []), ...(plan?.notReady ?? [])];
    const m = new Map<number, string>();
    all.forEach((a) => a.minSoilTemp !== undefined && !m.has(a.minSoilTemp) && m.set(a.minSoilTemp, a.crop));
    return [...m].map(([temp, crop]) => ({ temp, crop })).sort((a, b) => a.temp - b.temp);
  }, [plan]);

  const nOut = plan?.readyToPlantOut.length ?? 0;
  const nSow = plan?.readyToSow.length ?? 0;
  const nWait = plan?.notReady?.length ?? 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) go(input);
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Weather & Planting" description="Soil, frost and rain where you farm, and what you can plant this week." />
      <div className="grid gap-6 px-4 md:px-8">
        {/* Location */}
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex h-9 items-center gap-2 rounded-[9px] bg-app-panel px-3 shadow-[0_0_0_1px_var(--a-line-strong)] focus-within:shadow-[0_0_0_1px_var(--a-accent)] sm:w-56">
            <MapPin className="size-4 shrink-0 text-app-faint" />
            <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="Postcode" aria-label="Postcode" className="min-w-0 flex-1 bg-transparent uppercase outline-none placeholder:normal-case placeholder:text-app-faint" autoComplete="postal-code" />
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={looking || !input.trim()}>
              {looking ? "Finding…" : "Update"}
            </Button>
            {me?.postcode && place?.postcode.replace(/\s/g, "") !== me.postcode.replace(/\s/g, "") && (
              <Button type="button" variant="ghost" onClick={() => go(me.postcode!)}>
                Use farm postcode
              </Button>
            )}
          </div>
          <p className={cn("text-ui-sm sm:ml-auto", lookupError ? "text-app-red" : "text-app-faint")} aria-live="polite">
            {lookupError ?? (place ? `Showing ${place.name}, ${place.postcode}` : looking ? "" : !me?.postcode ? "Enter your farm's postcode to start." : "")}
          </p>
        </form>

        {e1 || e2 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-app-red-soft p-4 text-app-red">
            <span className="flex-1">We couldn&apos;t load the weather for {place?.postcode}. The service may be waking up.</span>
            <Button
              onClick={() => {
                r1();
                r2();
              }}
            >
              <ArrowsClockwise className="size-4" /> Try again
            </Button>
          </div>
        ) : (
          <>
            <ConditionsWidget c={place && !f1 ? c : undefined} thresholds={thresholds} />
            {c?.daily?.length ? <ForecastRow daily={c.daily} /> : null}

            {plan && !f2 ? (
              <p className="text-app-muted">
                {nOut + nSow > 0 ? (
                  <>
                    <span className="font-medium text-app-text">
                      {nOut} to plant out and {nSow} to sow
                    </span>{" "}
                    this week.
                  </>
                ) : (
                  "Nothing is ready to go in this week."
                )}{" "}
                {nWait > 0 && `${nWait} more waiting on warmer soil, less frost or later in the season.`}
              </p>
            ) : place ? (
              <Skeleton className="h-5 w-80" />
            ) : null}

            <Group icon={Shovel} title="Ready to plant out" items={plan?.readyToPlantOut} ready soil={c?.soilTemp6cm} loading={!!place && (f2 || !plan)} empty="Nothing ready to plant out right now." />
            <Group icon={Plant} title="Ready to sow" items={plan?.readyToSow} ready soil={c?.soilTemp6cm} loading={!!place && (f2 || !plan)} empty="Nothing ready to sow right now." />
            {(plan?.notReady?.length ?? 0) > 0 && <Group icon={Hourglass} title="Not yet" items={plan?.notReady} soil={c?.soilTemp6cm} />}
          </>
        )}
      </div>
    </div>
  );
}

function Group({ icon: Icon, title, items, ready, soil, loading, empty }: { icon: typeof Plant; title: string; items?: CropAdvice[]; ready?: boolean; soil?: number; loading?: boolean; empty?: string }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 flex items-center gap-2 font-medium">
        <Icon weight="duotone" className={cn("size-4", ready ? "text-app-accent" : "text-app-faint")} /> {title}
        {items && <span className="num text-app-faint">{items.length}</span>}
      </h2>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !items?.length ? (
        empty && <p className="rounded-xl p-4 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">{empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <CropCard key={a.crop} a={a} ready={!!ready} soil={soil} />
          ))}
        </ul>
      )}
    </section>
  );
}
