"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, HandHeart, Plus } from "@phosphor-icons/react/dist/ssr";
import { useFarmerRevenueQuery, useListFarmerOrdersQuery, useListMyProductsQuery, useListMySurplusQuery, useMeQuery } from "@/lib/api/farmnomad";
import { daysUntil, stockState, type Order, type Product } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import { RevenueChart } from "@/components/app/RevenueChart";
import { Avatar, Button, Pill, Skeleton, gbp, orderRef, time } from "@/components/app/ui";
import { statusMeta } from "@/components/app/orderMeta";
import { cn } from "@/lib/cn";

const RANGES = [
  ["7D", 7],
  ["30D", 30],
  ["90D", 90],
] as const;

export default function FarmerDashboard() {
  const { data: me } = useMeQuery();
  const { data: revenue } = useFarmerRevenueQuery();
  const { data: orders } = useListFarmerOrdersQuery();
  const { data: products } = useListMyProductsQuery();
  const { data: surplus } = useListMySurplusQuery();
  const { setProductSheet, setSurplusSheet } = useApp();
  const [range, setRange] = useState<number>(30);

  const rev = useMemo(() => {
    if (!revenue) return null;
    const cur = revenue.slice(-range);
    const prev = revenue.slice(-range * 2, -range);
    const sum = (a: typeof cur) => a.reduce((s, d) => s + d.value, 0);
    const total = sum(cur);
    const change = prev.length ? (total - sum(prev)) / sum(prev) : null;
    return { cur, total, change };
  }, [revenue, range]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const toPack = orders?.filter((o) => o.status === "PENDING") ?? [];
  const live = products?.filter((p) => p.quantityAvailable > 0) ?? [];
  const claimed = surplus?.reduce((s, x) => s + ((x.quantity ?? 0) - (x.availableQuantity ?? 0)), 0) ?? 0;
  const attention = (products ?? [])
    .map((p) => ({ p, s: stockState(p) }))
    .filter(({ s }) => s !== "active")
    .sort((a, b) => rank[a.s] - rank[b.s]);
  const today = (orders ?? []).filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");

  return (
    <div className="mx-auto min-w-0 max-w-[1200px] pb-16">
      <PageHeader
        title={me ? `${greet}, ${me.fullName.split(" ")[0]}` : greet}
        description={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <>
            <Button onClick={() => setSurplusSheet(true)}>
              <HandHeart className="size-4" /> Flag surplus
            </Button>
            <Button variant="primary" onClick={() => setProductSheet({ mode: "new" })} kbd="C">
              <Plus weight="bold" className="size-3.5" /> New product
            </Button>
          </>
        }
      />

      <div className="grid min-w-0 gap-4 px-4 md:px-8 [&>*]:min-w-0">
        {/* KPI strip, Mercury style: one surface, hairline dividers */}
        <section aria-label="This month" className="grid grid-cols-2 overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)] lg:grid-cols-4">
          <Stat label="Orders to pack" value={orders ? String(toPack.length) : null} href="/orders" note={toPack.length ? "Waiting at the farm" : "All packed"} />
          <Stat label="Live listings" value={products ? String(live.length) : null} href="/products" note={`${products?.length ?? 0} products in total`} />
          <Stat label="Need attention" value={products ? String(attention.length) : null} href="/products" note="Low, expiring or out" tone={attention.length ? "amber" : undefined} />
          <Stat label="Surplus claimed" value={surplus ? String(claimed) : null} href="/surplus/manage" note="Units to food groups" />
        </section>

        {/* Revenue */}
        <section className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] md:p-6" aria-labelledby="rev-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="rev-title" className="text-app-muted">Revenue</h2>
              {rev ? (
                <p className="mt-1 flex items-baseline gap-3">
                  <span className="num font-display text-[34px] font-medium leading-none tracking-[-0.03em]">{gbp(rev.total)}</span>
                  {rev.change !== null && (
                    <span className={cn("num text-ui font-medium", rev.change >= 0 ? "text-app-accent" : "text-app-red")}>
                      {rev.change >= 0 ? "+" : ""}
                      {(rev.change * 100).toFixed(1)}%
                    </span>
                  )}
                </p>
              ) : (
                <Skeleton className="mt-2 h-9 w-48" />
              )}
              <p className="mt-1 text-ui-sm text-app-faint">Last {range} days, against the {range} before</p>
            </div>
            <div role="tablist" aria-label="Range" className="relative grid grid-cols-3 rounded-[8px] bg-app-hover p-0.5">
              {RANGES.map(([label, n]) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={range === n}
                  onClick={() => setRange(n)}
                  className={cn("relative h-7 px-3 text-ui-sm font-medium transition-colors", range === n ? "text-app-text" : "text-app-muted hover:text-app-text")}
                >
                  {range === n && <motion.span layoutId="range" className="absolute inset-0 rounded-[6px] bg-app-panel shadow-[0_0_0_1px_var(--a-line),0_1px_2px_rgb(0_0_0/0.06)]" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6">{rev ? <RevenueChart data={rev.cur} /> : <Skeleton className="h-[220px] w-full" />}</div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          {/* Needs attention */}
          <section className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-labelledby="att-title">
            <Head id="att-title" title="Needs attention" href="/products" />
            {!products ? (
              <Rows />
            ) : attention.length === 0 ? (
              <p className="px-5 py-10 text-center text-app-muted">Nothing running low or close to its date.</p>
            ) : (
              <ul>
                {attention.slice(0, 5).map(({ p, s }) => (
                  <AttentionRow key={p.id} p={p} s={s} onEdit={() => setProductSheet({ mode: "edit", product: p })} onSurplus={() => setSurplusSheet(true)} />
                ))}
              </ul>
            )}
          </section>

          {/* Open orders */}
          <section className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-labelledby="ord-title">
            <Head id="ord-title" title="Open orders" href="/orders" />
            {!orders ? (
              <Rows />
            ) : (
              <ul>
                {today.slice(0, 5).map((o) => (
                  <OrderRow key={o.id} o={o} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const rank = { expired: 0, out: 1, expiring: 2, low: 3, active: 4 } as const;

function Stat({ label, value, note, href, tone }: { label: string; value: string | null; note: string; href: string; tone?: "amber" }) {
  return (
    <Link href={href} className="group relative border-app-line p-4 transition-colors hover:bg-app-hover md:p-5 [&:not(:last-child)]:border-r max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
      <p className="flex items-center justify-between text-app-muted">
        {label}
        <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className={cn("num mt-1.5 font-display text-[28px] font-medium leading-none tracking-[-0.03em]", tone === "amber" && "text-app-amber")}>{value}</p>
      )}
      <p className="mt-2 text-ui-sm text-app-faint">{note}</p>
    </Link>
  );
}

function Head({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="flex items-center justify-between border-b border-app-line px-5 py-3">
      <h2 id={id} className="font-medium">{title}</h2>
      <Link href={href} className="group flex items-center gap-1 text-ui-sm text-app-muted transition-colors hover:text-app-text">
        View all <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function Rows() {
  return (
    <div className="grid gap-3 p-5">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

function AttentionRow({ p, s, onEdit, onSurplus }: { p: Product; s: ReturnType<typeof stockState>; onEdit: () => void; onSurplus: () => void }) {
  const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
  const label = s === "expired" ? "Past best-before" : s === "out" ? "Out of stock" : s === "expiring" ? (d === 0 ? "Best before today" : `${d} day${d === 1 ? "" : "s"} left`) : `${p.quantityAvailable} left`;
  const tone = s === "expired" || s === "out" ? "red" : "amber";
  return (
    <li className="group flex items-center gap-3 border-b border-app-line px-5 py-2.5 last:border-0 hover:bg-app-hover">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-app-hover">
        {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={48} height={48} className="size-7 object-contain" />}
      </span>
      <button onClick={onEdit} className="min-w-0 flex-1 truncate text-left font-medium hover:underline">
        {p.name}
      </button>
      <Pill tone={tone}>{label}</Pill>
      {(s === "expiring" || s === "expired") && p.quantityAvailable > 0 ? (
        <Button size="sm" variant="ghost" onClick={onSurplus} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
          Flag surplus
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={onEdit} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
          Restock
        </Button>
      )}
    </li>
  );
}

function OrderRow({ o }: { o: Order }) {
  const m = statusMeta[o.status];
  return (
    <li className="border-b border-app-line last:border-0">
      <Link href={`/orders?open=${o.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-app-hover">
        <m.icon weight="fill" className={cn("size-4 shrink-0", m.color)} />
        <span className="num w-16 shrink-0 text-app-faint">{orderRef(o.id)}</span>
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">{o.productName}</span>
          <span className="text-app-faint"> × {o.quantity}</span>
        </span>
        <span className="hidden truncate text-app-muted sm:block">{o.customerName}</span>
        {o.driverName ? <Avatar name={o.driverName} className="size-5 text-[9px]" /> : <span className="size-5" />}
        <span className="num w-11 shrink-0 text-right text-ui-sm text-app-faint">{time(o.createdAt)}</span>
      </Link>
    </li>
  );
}
