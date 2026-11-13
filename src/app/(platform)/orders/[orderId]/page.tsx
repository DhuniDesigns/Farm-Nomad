"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowClockwise, ArrowLeft, ChatsCircle, MapPin, Receipt } from "@phosphor-icons/react/dist/ssr";
import { useGetOrderQuery, useGetProductQuery, useMeQuery } from "@/lib/api/farmnomad";
import { ORDER_FLOW, paymentMeta, statusMeta } from "@/components/app/orderMeta";
import { useCart } from "@/components/app/shop/useCart";
import { Avatar, Button, EmptyState, Pill, Skeleton, gbp, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const copy: Record<string, string> = {
  PENDING: "The farm is packing your order.",
  ASSIGNED: "A local driver is collecting it from the farm.",
  IN_TRANSIT: "On the way to you now.",
  DELIVERED: "Delivered to your door.",
  CANCELLED: "This order was cancelled.",
};

/** Order tracking (spec §7.9): header, product, driver, OrderTimeline PENDING → ASSIGNED → IN_TRANSIT → DELIVERED. */
export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: o, isLoading, isError } = useGetOrderQuery(Number(orderId));
  const { data: p } = useGetProductQuery(o?.productId ?? 0, { skip: !o });
  const { data: me } = useMeQuery();
  const { addToCart } = useCart();

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-[760px] gap-4 px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  if (isError || !o)
    return <EmptyState icon={<Receipt className="size-5" />} title="Order not found" body="It may belong to another account." action={<Link href="/orders"><Button>My orders</Button></Link>} />;

  const m = statusMeta[o.status];
  const step = ORDER_FLOW.indexOf(o.status);

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-16 md:px-8">
      <div className="pt-5">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-app-muted transition-colors hover:text-app-text">
          <ArrowLeft className="size-4" /> {me?.role === "CUSTOMER" ? "My orders" : me?.role === "KITCHEN" ? "Ingredient orders" : "Orders"}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="num text-app-faint">{orderRef(o.id)} · placed {relDay(o.createdAt).toLowerCase()} at {time(o.createdAt)}</p>
          <h1 className="mt-1 font-display text-[28px] font-medium tracking-[-0.03em]">{m.label}</h1>
          <p className="text-app-muted">{copy[o.status]}</p>
        </div>
        <Pill tone={paymentMeta[o.paymentStatus].tone}>{paymentMeta[o.paymentStatus].label}</Pill>
      </div>

      {/* Timeline */}
      {o.status !== "CANCELLED" && (
        <section aria-label="Progress" className="mt-6 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
          <ol className="grid grid-cols-4 gap-2">
            {ORDER_FLOW.map((s, i) => {
              const done = i <= step;
              const sm = statusMeta[s];
              return (
                <li key={s} className="grid gap-2.5">
                  <span className="relative h-1.5 overflow-hidden rounded-full bg-app-hover">
                    <span className={cn("absolute inset-y-0 left-0 rounded-full bg-app-accent transition-[width] duration-700 ease-out", done ? "w-full" : "w-0")} />
                    {i === step && o.status !== "DELIVERED" && <span className="absolute inset-0 animate-pulse rounded-full bg-app-accent/40 motion-reduce:animate-none" />}
                  </span>
                  <span className={cn("flex items-center gap-1.5 text-ui-sm", done ? "font-medium text-app-text" : "text-app-faint")}>
                    <sm.icon weight={done ? "fill" : "regular"} className={cn("hidden size-3.5 sm:block", done && sm.color)} />
                    {sm.short}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-4 flex items-center gap-4 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Item">
        <Link href={`/marketplace/${o.productId}`} className="grid size-16 shrink-0 place-items-center rounded-xl bg-app-hover">
          {p?.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={96} height={96} className="size-14 object-contain" />}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/marketplace/${o.productId}`} className="block truncate font-medium hover:underline">{o.productName}</Link>
          <p className="truncate text-ui-sm text-app-faint">{p?.farmerName}</p>
          <p className="num mt-0.5 text-app-muted">{o.quantity} × {p ? gbp(p.price) : "–"}</p>
        </div>
        {p && <p className="num font-display text-[20px] font-medium tracking-[-0.02em]">{gbp(p.price * o.quantity)}</p>}
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Driver">
          <p className="text-ui-sm text-app-faint">Driver</p>
          {o.driverName ? (
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={o.driverName} className="size-9 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.driverName}</p>
                <p className="text-ui-sm text-app-faint">Local FarmNomad driver</p>
              </div>
              <Link href={`/messages?to=${o.driverId}&name=${encodeURIComponent(o.driverName ?? "")}`} aria-label={`Message ${o.driverName}`} className="grid size-8 place-items-center rounded-full text-app-muted shadow-[0_0_0_1px_var(--a-line-strong)] transition-colors hover:bg-app-hover hover:text-app-text">
                <ChatsCircle className="size-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-app-muted">{o.status === "CANCELLED" ? "Not needed" : "We'll assign one once the farm has packed your order."}</p>
          )}
        </section>
        <section className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Delivery address">
          <p className="text-ui-sm text-app-faint">Delivering to</p>
          <p className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-app-muted" />
            <span>{me ? [me.address, me.city, me.postcode].filter(Boolean).join(", ") : "–"}</span>
          </p>
        </section>
      </div>

      {p && p.quantityAvailable > 0 && (me?.role === "CUSTOMER" || me?.role === "KITCHEN") && (o.status === "DELIVERED" || o.status === "CANCELLED") && (
        <Button className="mt-6" onClick={() => addToCart(p, o.quantity)}>
          <ArrowClockwise className="size-4" /> Buy again
        </Button>
      )}
    </div>
  );
}
