"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { CaretRight, Receipt } from "@phosphor-icons/react/dist/ssr";
import { useListProductsQuery, useMyOrdersQuery } from "@/lib/api/farmnomad";
import { PageHeader } from "@/components/app/PageHeader";
import { paymentMeta, statusMeta } from "@/components/app/orderMeta";
import { Button, EmptyState, Pill, Skeleton, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const TABS = [
  ["all", "All"],
  ["active", "In progress"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
] as const;
const ACTIVE = ["PENDING", "ASSIGNED", "IN_TRANSIT"];

/** Customer's orders (spec §7.9): status tabs, then a row per order linking to tracking. */
export function CustomerOrders() {
  const { data, isLoading } = useMyOrdersQuery();
  const { data: products } = useListProductsQuery();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");

  const rows = useMemo(
    () => (data ?? []).filter((o) => (tab === "all" ? true : tab === "active" ? ACTIVE.includes(o.status) : o.status === tab)),
    [data, tab],
  );
  const count = (t: string) => (data ?? []).filter((o) => (t === "all" ? true : t === "active" ? ACTIVE.includes(o.status) : o.status === t)).length;

  return (
    <div className="mx-auto max-w-[900px] pb-16">
      <PageHeader title="My orders" description="Follow each order from the farm gate to your door." />
      <div role="tablist" aria-label="Filter orders" className="mx-4 flex gap-0.5 overflow-x-auto border-b border-app-line pb-2.5 md:mx-8">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 transition-colors", tab === id ? "text-app-text" : "text-app-muted hover:text-app-text")}>
            {tab === id && <motion.span layoutId="co-tab" className="absolute inset-0 rounded-[7px] bg-app-active" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />}
            <span className="relative">{label}</span>
            {!!count(id) && <span className="num relative text-ui-sm text-app-faint">{count(id)}</span>}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 md:px-8">
        {isLoading ? (
          <div className="grid gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}</div>
        ) : !rows.length ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title={data?.length ? "Nothing here" : "No orders yet"}
            body={data?.length ? "Orders with this status will show up here." : "When you buy from a farm, you can follow it here from packing to your door."}
            action={!data?.length ? <Link href="/marketplace"><Button variant="primary">Browse the marketplace</Button></Link> : undefined}
          />
        ) : (
          <ul className="grid gap-2">
            {rows.map((o) => {
              const m = statusMeta[o.status];
              const p = products?.find((x) => x.id === o.productId);
              return (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="group flex items-center gap-4 rounded-xl p-3 pr-4 shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:bg-app-hover">
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-app-hover">
                      {p?.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={72} height={72} className="size-10 object-contain" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {o.productName} <span className="num font-normal text-app-faint">× {o.quantity}</span>
                      </p>
                      <p className="num truncate text-ui-sm text-app-faint">
                        {orderRef(o.id)} · {relDay(o.createdAt)}, {time(o.createdAt)}
                        {o.paymentStatus !== "PAID" && ` · ${paymentMeta[o.paymentStatus].label}`}
                      </p>
                    </div>
                    <Pill tone={m.tone} dot={false} className="gap-1">
                      <m.icon weight="fill" className="size-3.5" /> {m.label}
                    </Pill>
                    <CaretRight className="size-4 text-app-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
