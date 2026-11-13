"use client";

import Link from "next/link";
import { ArrowRight, Plant, Plus, Warning } from "@phosphor-icons/react/dist/ssr";
import { useKitchenMealOrdersQuery, useListSurplusQuery, useMeQuery, useMyMealsQuery } from "@/lib/api/farmnomad";
import { PageHeader } from "@/components/app/PageHeader";
import { OrderTicket } from "@/components/app/meals/OrderCard";
import { MealArt } from "@/components/app/meals/meta";
import { Button, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const today = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/** Kitchen home (spec §7.4 /dashboard/kitchen): the pass, the menu, and ingredients from local farms. */
export default function KitchenDashboard() {
  const { data: me } = useMeQuery();
  const { data: orders } = useKitchenMealOrdersQuery(undefined, { pollingInterval: 10000 });
  const { data: menu } = useMyMealsQuery();
  // Kitchens see cheap surplus as well; good for tomorrow's specials.
  const { data: surplus } = useListSurplusQuery();

  const live = orders?.filter((o) => o.status === "NEW" || o.status === "PREPARING" || o.status === "READY") ?? [];
  const todays = orders?.filter((o) => today(o.createdAt) && o.status !== "CANCELLED") ?? [];
  const takings = todays.reduce((s, o) => s + o.total, 0);
  const portions = todays.reduce((s, o) => s + o.quantity, 0);
  const low = menu?.filter((m) => m.portionsAvailable <= 3) ?? [];
  const hour = new Date().getHours();

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader
        title={`${hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening"}, ${me?.fullName.split(" ")[0] ?? "chef"}`}
        description="Fishergate Kitchen on NomadEat"
        actions={
          <Link href="/meals">
            <Button variant="primary">
              <Plus weight="bold" className="size-3.5" /> Add meal
            </Button>
          </Link>
        }
      />
      <div className="grid gap-6 px-4 md:px-8">
        <dl className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <Stat label="Orders to cook" value={orders ? String(live.filter((o) => o.status !== "READY").length) : null} href="/meals/orders" />
          <Stat label="Waiting for collection" value={orders ? String(live.filter((o) => o.status === "READY").length) : null} href="/meals/orders" />
          <Stat label="Portions sold today" value={orders ? String(portions) : null} />
          <Stat label="Taken today" value={orders ? gbp(takings) : null} />
        </dl>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="pass">
            <Head id="pass" title="On the pass" href="/meals/orders" />
            {!orders ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : live.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {live.slice(0, 6).map((o) => (
                  <OrderTicket key={o.id} o={o} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl p-5 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">All quiet. New orders appear here as diners place them.</p>
            )}
          </section>

          <div className="grid gap-6">
            <section aria-labelledby="menu">
              <Head id="menu" title="Running low" href="/meals" />
              <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
                {!menu ? (
                  <li className="p-4">
                    <Skeleton className="h-10" />
                  </li>
                ) : low.length ? (
                  low.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 border-b border-app-line px-4 py-3 last:border-0">
                      <MealArt meal={m} className="size-10 shrink-0 rounded-lg" sizes="40px" />
                      <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                      <span className={cn("num inline-flex items-center gap-1 text-ui-sm", m.portionsAvailable === 0 ? "text-app-red" : "text-app-amber")}>
                        <Warning weight="fill" className="size-3.5" />
                        {m.portionsAvailable === 0 ? "Sold out" : `${m.portionsAvailable} left`}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-app-faint">Every meal has plenty of portions.</li>
                )}
              </ul>
            </section>

            <section aria-labelledby="farms" className="overflow-hidden rounded-xl bg-app-accent-soft p-5">
              <h2 id="farms" className="flex items-center gap-2 font-medium text-app-accent">
                <Plant weight="fill" className="size-4" /> From local farms
              </h2>
              <p className="mt-1.5 text-ui-sm text-app-muted">
                {surplus?.length ? `${surplus.filter((s) => !s.claimedByMe).length} farms nearby have surplus this week, often cheaper. ` : ""}
                Buy ingredients straight from the farm and list them on your meals.
              </p>
              <Link href="/marketplace" className="mt-3 inline-flex items-center gap-1 text-ui-sm font-medium text-app-accent hover:underline">
                Buy ingredients <ArrowRight className="size-3.5" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Head({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 id={id} className="font-medium">
        {title}
      </h2>
      <Link href={href} className="inline-flex items-center gap-1 text-ui-sm font-medium text-app-accent hover:underline">
        See all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string | null; href?: string }) {
  const body = (
    <>
      <dt className="text-ui-sm text-app-muted">{label}</dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{value === null ? <Skeleton className="h-7 w-12" /> : value}</dd>
    </>
  );
  const cls = "rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-app-hover")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
