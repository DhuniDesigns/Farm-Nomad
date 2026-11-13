"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChatsCircle, CheckCircle, HandTap, MapTrifold, Package } from "@phosphor-icons/react/dist/ssr";
import { useGetOrderQuery, useGetProductQuery } from "@/lib/api/farmnomad";
import { DonationTag, MapsLink, Route, nextStep, useJobActions } from "@/components/app/driver/parts";
import { ORDER_FLOW, statusMeta } from "@/components/app/orderMeta";
import { Button, EmptyState, Pill, Skeleton, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const STEPS: Record<string, string> = { PENDING: "Waiting for a driver", ASSIGNED: "Accepted · collect", IN_TRANSIT: "Collected · on the way", DELIVERED: "Delivered" };

/** One job, everything a driver needs at the van door. */
export default function JobPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: o, isLoading, isError } = useGetOrderQuery(Number(orderId));
  const { data: p } = useGetProductQuery(o?.productId ?? 0, { skip: !o });
  const { advance, busy } = useJobActions();

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-[720px] gap-4 px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  if (isError || !o)
    return (
      <EmptyState
        icon={<MapTrifold className="size-5" />}
        title="That job isn't available"
        body="Another driver may have taken it."
        action={
          <Link href="/jobs?tab=available">
            <Button>See available jobs</Button>
          </Link>
        }
      />
    );

  const step = nextStep(o);
  const m = statusMeta[o.status];
  const at = ORDER_FLOW.indexOf(o.status);
  const mine = !!o.driverId;

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 md:px-8 md:pb-16">
      <div className="pt-5">
        <Link href={mine ? "/jobs" : "/jobs?tab=available"} className="inline-flex items-center gap-1.5 text-app-muted transition-colors hover:text-app-text">
          <ArrowLeft className="size-4" /> Jobs
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-app-faint">
            {orderRef(o.id)} · {relDay(o.createdAt).toLowerCase()} at {time(o.createdAt)}
          </p>
          <h1 className="mt-1 font-display text-[28px] font-medium tracking-[-0.03em]">{STEPS[o.status] ?? m.label}</h1>
          {step && <p className="text-app-muted">{step.hint}</p>}
        </div>
        {o.donationId ? <DonationTag /> : <Pill tone={m.tone}>{m.short}</Pill>}
      </div>

      {/* Progress */}
      <ol className="mt-6 grid grid-cols-4 gap-1.5" aria-label="Progress">
        {ORDER_FLOW.map((s, i) => (
          <li key={s} className="grid gap-1.5">
            <span className={cn("h-1 rounded-full", i <= at ? "bg-app-accent" : "bg-app-hover")} />
            <span className={cn("text-[11px] font-medium", i <= at ? "text-app-text" : "text-app-faint")}>{["Packed", "Accepted", "Collected", "Delivered"][i]}</span>
          </li>
        ))}
      </ol>

      {/* Route */}
      <section className="mt-6 rounded-2xl p-5 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Route">
        <Route o={o} />
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-app-line pt-4">
          {(o.status === "ASSIGNED" || o.status === "PENDING") && <MapsLink o={o} toPickup />}
          <MapsLink o={o} />
        </div>
      </section>

      {/* Load */}
      <section className="mt-4 flex items-center gap-4 rounded-2xl p-4 shadow-[0_0_0_1px_var(--a-line)]" aria-label="What you're carrying">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-app-hover">
          {p?.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={96} height={96} className="size-12 object-contain" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{o.productName}</p>
          <p className="text-app-muted">
            <span className="num">{o.quantity}</span> {o.quantity === 1 ? "item" : "items"} {p?.tags?.[0] ? `· ${p.tags[0]}` : ""}
          </p>
        </div>
        <Package className="size-5 text-app-faint" />
      </section>

      {/* People */}
      {mine && (
        <section className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Contacts">
          <Contact who={o.farmerName ?? "Farm"} role="Collect from" id={p?.farmerId ?? 7} />
          <Contact who={o.customerName} role={o.donationId ? "Food group" : "Deliver to"} id={o.customerId} />
        </section>
      )}

      {o.status === "DELIVERED" && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-app-accent-soft p-4 text-app-accent">
          <CheckCircle weight="fill" className="size-5" /> Delivered {o.updatedAt ? `at ${time(o.updatedAt)}` : ""}. Thanks for the run.
        </p>
      )}

      {/* Sticky action on phones, inline on desktop */}
      {step && (
        <div className="fixed inset-x-0 bottom-14 z-30 border-t border-app-line bg-app-bg/90 p-3 backdrop-blur-xl md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
          <Button variant="primary" className="h-11 w-full text-[15px]" disabled={busy} onClick={() => advance(o)}>
            {o.status === "PENDING" ? <HandTap className="size-4" /> : o.status === "ASSIGNED" ? <Package className="size-4" /> : <CheckCircle className="size-4" />}
            {step.label}
          </Button>
        </div>
      )}
    </div>
  );
}

function Contact({ who, role, id }: { who: string; role: string; id: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5 shadow-[0_0_0_1px_var(--a-line)]">
      <div className="min-w-0 flex-1">
        <p className="text-ui-sm text-app-faint">{role}</p>
        <p className="truncate font-medium">{who}</p>
      </div>
      <Link href={`/messages?to=${id}&name=${encodeURIComponent(who)}`} aria-label={`Message ${who}`} className="grid size-9 place-items-center rounded-full bg-app-hover text-app-muted transition-colors hover:text-app-text">
        <ChatsCircle className="size-4" />
      </Link>
    </div>
  );
}
