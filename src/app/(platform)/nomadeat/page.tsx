"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ArrowRight, ForkKnife, MagnifyingGlass, Plant, Storefront } from "@phosphor-icons/react/dist/ssr";
import { useListMealsQuery, useMyMealOrdersQuery } from "@/lib/api/farmnomad";
import { PageHeader } from "@/components/app/PageHeader";
import { CUISINES, DIETARY, DietTags, MealArt, mealOrderMeta } from "@/components/app/meals/meta";
import { EmptyState, Pill, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

/** NomadEat browse (spec §7 /nomadeat): ready meals from local kitchens, made with produce from FarmNomad farms. */
export default function NomadEatPage() {
  const { data, isLoading } = useListMealsQuery();
  const { data: mine } = useMyMealOrdersQuery();
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [diet, setDiet] = useState<string | null>(null);

  const meals = useMemo(
    () =>
      (data ?? []).filter(
        (m) =>
          (!cuisine || m.cuisine === cuisine) &&
          (!diet || m.dietary?.includes(diet)) &&
          (!q || `${m.name} ${m.kitchenName} ${m.description}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, cuisine, diet, q],
  );
  const cuisines = CUISINES.filter((c) => data?.some((m) => m.cuisine === c));
  const active = mine?.filter((o) => o.status === "NEW" || o.status === "PREPARING" || o.status === "READY") ?? [];

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="NomadEat" description="Ready meals from kitchens near you, cooked with produce from local farms." />
      <div className="grid gap-5 px-4 md:px-8">
        {active.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Your meal orders">
            {active.map((o) => {
              const m = mealOrderMeta[o.status];
              return (
                <li key={o.id} className="flex items-center gap-3 rounded-xl bg-app-panel p-3.5 shadow-[0_0_0_1px_var(--a-line)]">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", o.status === "READY" ? "bg-app-accent-soft text-app-accent" : "bg-app-hover text-app-muted")}>
                    <m.icon weight="fill" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {o.quantity} × {o.mealName}
                    </span>
                    <span className="block truncate text-ui-sm text-app-faint">{o.kitchenName}</span>
                  </span>
                  <Pill tone={m.tone}>{m.customer}</Pill>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex h-9 items-center gap-2 rounded-[9px] bg-app-hover px-3 text-app-faint shadow-[inset_0_0_0_1px_var(--a-line)] md:w-72">
            <MagnifyingGlass className="size-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals or kitchens" className="min-w-0 flex-1 bg-transparent text-app-text outline-none placeholder:text-app-faint" />
          </label>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Cuisine">
            {[null, ...cuisines].map((c) => (
              <button key={c ?? "all"} onClick={() => setCuisine(c)} aria-pressed={cuisine === c} className={cn("relative h-8 shrink-0 rounded-full px-3 text-ui-sm font-medium transition-colors", cuisine === c ? "text-app-on-primary" : "text-app-muted hover:bg-app-hover hover:text-app-text")}>
                {cuisine === c && <motion.span layoutId="cuisine" className="absolute inset-0 rounded-full bg-app-primary" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />}
                <span className="relative">{c ?? "All"}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="-mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Dietary">
          {DIETARY.map((d) => (
            <button key={d} onClick={() => setDiet(diet === d ? null : d)} aria-pressed={diet === d} className={cn("h-7 rounded-full px-2.5 text-[12px] font-medium transition-[background-color,box-shadow,color]", diet === d ? "bg-app-accent-soft text-app-accent shadow-[inset_0_0_0_1px_var(--a-accent)]" : "text-app-faint shadow-[inset_0_0_0_1px_var(--a-line)] hover:text-app-muted")}>
              {d}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : !meals.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState icon={<ForkKnife className="size-5" />} title={data?.length ? "No meals match" : "No meals right now"} body={data?.length ? "Try another cuisine or clear the filters." : "Kitchens near you add meals through the day."} />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((m) => (
              <li key={m.id}>
                <Link href={`/nomadeat/${m.id}`} className="group block overflow-hidden rounded-2xl bg-app-panel shadow-[0_0_0_1px_var(--a-line)] transition-shadow duration-200 hover:shadow-[0_0_0_1px_var(--a-line-strong),0_12px_28px_-14px_rgb(0_0_0/0.2)]">
                  <div className="relative">
                    <MealArt meal={m} className="aspect-[16/10] transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
                    {m.portionsAvailable <= 3 && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">Only {m.portionsAvailable} left</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{m.name}</p>
                      <p className="num shrink-0 font-medium">{gbp(m.price)}</p>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-ui-sm text-app-muted">
                      <Storefront className="size-3.5" /> {m.kitchenName} · {m.kitchenArea}
                    </p>
                    <p className="mt-2 line-clamp-2 text-ui-sm text-app-faint">{m.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <DietTags tags={m.dietary} />
                      {!!m.farms?.length && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-app-faint">
                          <Plant weight="fill" className="size-3 text-app-accent" /> {m.farms.length === 1 ? m.farms[0] : `${m.farms.length} local farms`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href="/marketplace" className="flex items-center justify-between gap-3 rounded-xl p-4 text-app-muted shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:bg-app-hover hover:text-app-text">
          <span>Cooking yourself? Get the same produce straight from the farm.</span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
