"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { CaretDown, MapPin, Receipt, User as UserIcon } from "@phosphor-icons/react/dist/ssr";
import { useListFarmerOrdersQuery, useListMyProductsQuery } from "@/lib/api/farmnomad";
import type { Order, OrderStatus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { useApp } from "@/components/app/AppState";
import { CustomerOrders } from "@/components/app/shop/CustomerOrders";
import { Sheet } from "@/components/app/Sheet";
import { ORDER_FLOW, paymentMeta, statusMeta } from "@/components/app/orderMeta";
import { Avatar, EmptyState, Pill, Skeleton, gbp, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const GROUPS: OrderStatus[] = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const { role } = useApp();
  return role === "CUSTOMER" ? <CustomerOrders /> : <FarmerOrders />;
}

function FarmerOrders() {
  const { data, isLoading } = useListFarmerOrdersQuery();
  const [openId, setOpenId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ CANCELLED: true });

  // Deep link from the dashboard: /orders?open=2031
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("open"));
    if (id) setOpenId(id);
  }, []);

  const grouped = useMemo(() => GROUPS.map((s) => ({ s, items: (data ?? []).filter((o) => o.status === s) })), [data]);
  const open = data?.find((o) => o.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    if (window.location.search) window.history.replaceState(null, "", "/orders");
  };

  return (
    <div className="pb-16">
      <PageHeader title="Orders" description="Grouped by where each order is right now." />
      <div className="border-t border-app-line">
        {isLoading ? (
          <div className="grid gap-2 px-4 py-4 md:px-8">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.length ? (
          <EmptyState icon={<Receipt className="size-5" />} title="No orders yet" body="When a buyer orders one of your products it shows up here, ready to pack." />
        ) : (
          grouped.map(({ s, items }) => {
            if (!items.length) return null;
            const m = statusMeta[s];
            const isCollapsed = collapsed[s];
            return (
              <section key={s} aria-label={m.label}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [s]: !c[s] }))}
                  aria-expanded={!isCollapsed}
                  className="sticky top-0 z-10 flex h-9 w-full items-center gap-2 border-b border-app-line bg-app-side/95 px-4 text-left backdrop-blur md:px-8"
                >
                  <CaretDown className={cn("size-3 text-app-faint transition-transform duration-200", isCollapsed && "-rotate-90")} />
                  <m.icon weight="fill" className={cn("size-4", m.color)} />
                  <span className="font-medium">{m.label}</span>
                  <span className="num text-app-faint">{items.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      {items.map((o) => (
                        <Row key={o.id} o={o} onOpen={() => setOpenId(o.id)} active={openId === o.id} />
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </section>
            );
          })
        )}
      </div>
      <OrderDetail order={open} onClose={close} />
    </div>
  );
}

function Row({ o, onOpen, active }: { o: Order; onOpen: () => void; active: boolean }) {
  const m = statusMeta[o.status];
  const pay = paymentMeta[o.paymentStatus];
  return (
    <li className="border-b border-app-line">
      <button onClick={onOpen} className={cn("flex h-11 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-app-hover md:px-8", active && "bg-app-active")}>
        <m.icon weight="fill" className={cn("size-4 shrink-0", m.color)} />
        <span className="num hidden w-16 shrink-0 text-app-faint sm:block">{orderRef(o.id)}</span>
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">{o.productName}</span>
          <span className="num text-app-faint"> × {o.quantity}</span>
        </span>
        <span className="hidden w-44 truncate text-app-muted lg:block">{o.customerName}</span>
        <span className="hidden w-20 sm:block">
          <Pill tone={pay.tone}>{pay.label}</Pill>
        </span>
        <span className="hidden w-32 items-center gap-2 truncate text-app-muted md:flex">
          {o.driverName ? (
            <>
              <Avatar name={o.driverName} className="size-5 text-[9px]" /> <span className="truncate">{o.driverName}</span>
            </>
          ) : (
            <span className="text-app-faint">No driver yet</span>
          )}
        </span>
        <span className="num w-24 shrink-0 text-right text-ui-sm text-app-faint">
          {relDay(o.createdAt)}, {time(o.createdAt)}
        </span>
      </button>
    </li>
  );
}

function OrderDetail({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { data: products } = useListMyProductsQuery();
  const [last, setLast] = useState<Order | null>(order);
  useEffect(() => {
    if (order) setLast(order);
  }, [order]);
  const o = order ?? last;
  const p = products?.find((x) => x.id === o?.productId);
  const step = o ? ORDER_FLOW.indexOf(o.status) : -1;

  return (
    <Sheet
      open={!!order}
      onClose={onClose}
      width={460}
      title={o ? `${orderRef(o.id)} · ${o.productName}` : ""}
      subtitle={o ? `Placed ${relDay(o.createdAt).toLowerCase()} at ${time(o.createdAt)}` : undefined}
    >
      {o && (
        <div className="grid gap-6 px-5 py-5">
          <div className="flex items-center gap-4 rounded-xl p-3 shadow-[0_0_0_1px_var(--a-line)]">
            <span className="grid size-14 place-items-center rounded-lg bg-app-hover">
              {p?.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={96} height={96} className="size-12 object-contain" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{o.productName}</p>
              <p className="num text-app-muted">
                {o.quantity} × {p ? gbp(p.price) : "–"}
              </p>
            </div>
            {p && <p className="num font-display text-[20px] font-medium tracking-[-0.02em]">{gbp(p.price * o.quantity)}</p>}
          </div>

          <div>
            <p className="mb-3 font-medium">Progress</p>
            {o.status === "CANCELLED" ? (
              <Pill tone="neutral">Cancelled · {paymentMeta[o.paymentStatus].label}</Pill>
            ) : (
              <ol className="grid gap-0">
                {ORDER_FLOW.map((s, i) => {
                  const m = statusMeta[s];
                  const done = i <= step;
                  return (
                    <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                      {i < ORDER_FLOW.length - 1 && <span className={cn("absolute left-[7px] top-5 h-[calc(100%-16px)] w-px", i < step ? "bg-app-accent" : "bg-app-line-strong")} />}
                      <span className={cn("relative mt-0.5 grid size-[15px] place-items-center rounded-full", done ? "bg-app-accent" : "bg-app-panel shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]")}>
                        {i === step && o.status !== "DELIVERED" && <span className="absolute inset-0 animate-ping rounded-full bg-app-accent/40 motion-reduce:animate-none" />}
                      </span>
                      <div className={cn(!done && "text-app-faint")}>
                        <p className={cn(i === step && "font-medium")}>{m.label}</p>
                        {i === step && <p className="text-ui-sm text-app-faint">{i === 0 ? "Pack this order for collection" : i === 3 ? "Signed for at the door" : o.driverName ? `With ${o.driverName}` : ""}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <dl className="grid gap-3 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
            <Detail icon={<UserIcon className="size-4" />} label="Customer" value={o.customerName} />
            <Detail icon={<MapPin className="size-4" />} label="Driver" value={o.driverName ?? "Not assigned yet"} muted={!o.driverName} />
            <Detail icon={<Receipt className="size-4" />} label="Payment" value={<Pill tone={paymentMeta[o.paymentStatus].tone}>{paymentMeta[o.paymentStatus].label}</Pill>} />
          </dl>
        </div>
      )}
    </Sheet>
  );
}

function Detail({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="flex w-28 items-center gap-2 text-app-muted">
        {icon}
        {label}
      </dt>
      <dd className={cn("min-w-0 truncate", muted && "text-app-faint")}>{value}</dd>
    </div>
  );
}
