"use client";

import { CookingPot } from "@phosphor-icons/react/dist/ssr";
import { useKitchenMealOrdersQuery } from "@/lib/api/farmnomad";
import type { MealOrderStatus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { OrderTicket } from "@/components/app/meals/OrderCard";
import { mealOrderMeta } from "@/components/app/meals/meta";
import { EmptyState, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const LANES: MealOrderStatus[] = ["NEW", "PREPARING", "READY"];

/** The kitchen pass: new → cooking → ready, then a log of what's been collected. */
export default function MealOrdersPage() {
  const { data, isLoading } = useKitchenMealOrdersQuery(undefined, { pollingInterval: 10000 });
  const done = data?.filter((o) => o.status === "COLLECTED" || o.status === "CANCELLED") ?? [];

  return (
    <div className="pb-16">
      <PageHeader title="Meal orders" description="Move each order along as you cook. Diners are told when it's ready." />
      <div className="grid gap-6 px-4 md:px-8">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState icon={<CookingPot className="size-5" />} title="No orders yet" body="When a diner orders from your menu on NomadEat, it lands here." />
          </div>
        ) : (
          <div className="grid items-start gap-3 md:grid-cols-3">
            {LANES.map((s) => {
              const items = data.filter((o) => o.status === s);
              const m = mealOrderMeta[s];
              return (
                <section key={s} aria-label={m.label} className="grid gap-2 rounded-2xl bg-app-hover/60 p-2.5">
                  <h2 className="flex items-center gap-2 px-1.5 pt-0.5 font-medium">
                    <m.icon weight="fill" className={cn("size-4", s === "NEW" ? "text-app-amber" : s === "PREPARING" ? "text-app-blue" : "text-app-accent")} />
                    {m.label}
                    <span className="num text-app-faint">{items.length}</span>
                  </h2>
                  {items.length ? (
                    <ul className="grid gap-2">
                      {items.map((o) => (
                        <OrderTicket key={o.id} o={o} />
                      ))}
                    </ul>
                  ) : (
                    <p className="px-1.5 pb-2 text-ui-sm text-app-faint">Nothing {s === "NEW" ? "new" : s === "PREPARING" ? "cooking" : "waiting"}.</p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {done.length > 0 && (
          <section aria-labelledby="done">
            <h2 id="done" className="mb-3 font-medium">
              Earlier <span className="num text-app-faint">{done.length}</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {done.map((o) => (
                <OrderTicket key={o.id} o={o} compact />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
