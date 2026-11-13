"use client";

import Link from "next/link";
import { ArrowRight, ChatsCircle, CheckCircle, MapTrifold, Package, Truck } from "@phosphor-icons/react/dist/ssr";
import { useAssignedOrdersQuery, useGetProductQuery, useMeQuery, useUnassignedOrdersQuery } from "@/lib/api/farmnomad";
import type { Order } from "@/lib/types/api";
import { DonationTag, JobRow, MapsLink, Route, nextStep, useJobActions } from "@/components/app/driver/parts";
import { statusMeta } from "@/components/app/orderMeta";
import { Button, EmptyState, Skeleton, orderRef } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/** Driver home (spec §7.4 /dashboard/driver): the job in hand, what's next, and work nearby. */
export default function DriverDashboard() {
  const { data: me } = useMeQuery();
  const { data: mine, isLoading } = useAssignedOrdersQuery(undefined, { pollingInterval: 15000 });
  const { data: open } = useUnassignedOrdersQuery(undefined, { pollingInterval: 15000 });

  const active = (mine ?? []).filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT");
  const current = active.find((o) => o.status === "IN_TRANSIT") ?? active[0];
  const upNext = active.filter((o) => o.id !== current?.id);
  const doneToday = (mine ?? []).filter((o) => o.status === "DELIVERED" && isToday(o.updatedAt ?? o.createdAt));
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-16 md:px-8">
      <div className="pb-5 pt-7 md:pt-9">
        <p className="text-app-muted">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 font-display text-[28px] font-medium tracking-[-0.03em]">
          {hello}, {me?.fullName.split(" ")[0] ?? "there"}
        </h1>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Active" value={active.length} icon={Truck} loading={isLoading} />
        <Stat label="Delivered today" value={doneToday.length} icon={CheckCircle} loading={isLoading} />
        <Stat label="Waiting nearby" value={open?.length ?? 0} icon={MapTrifold} loading={!open} href="/jobs?tab=available" />
      </dl>

      <section className="mt-6" aria-labelledby="now">
        <h2 id="now" className="mb-3 font-medium">
          Right now
        </h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : current ? (
          <CurrentJob o={current} />
        ) : (
          <div className="rounded-2xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState
              icon={<Truck className="size-5" />}
              title="No job in hand"
              body={open?.length ? `${open.length} job${open.length === 1 ? " is" : "s are"} waiting for a driver near you.` : "New jobs show up here as farms pack orders."}
              action={
                <Link href="/jobs?tab=available">
                  <Button variant="primary">Find a job</Button>
                </Link>
              }
            />
          </div>
        )}
      </section>

      {upNext.length > 0 && (
        <section className="mt-8" aria-labelledby="next">
          <h2 id="next" className="mb-3 font-medium">
            Up next <span className="num text-app-faint">{upNext.length}</span>
          </h2>
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {upNext.map((o) => (
              <JobRow key={o.id} o={o} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="near">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="near" className="font-medium">
            Jobs near you <span className="num text-app-faint">{open?.length ?? ""}</span>
          </h2>
          <Link href="/jobs?tab=available" className="inline-flex items-center gap-1 text-ui-sm font-medium text-app-accent hover:underline">
            See all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {open?.length ? (
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {open.slice(0, 3).map((o) => (
              <JobRow key={o.id} o={o} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl p-5 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">Nothing waiting right now. We&apos;ll notify you when a farm packs an order.</p>
        )}
      </section>

      {doneToday.length > 0 && (
        <section className="mt-8" aria-labelledby="done">
          <h2 id="done" className="mb-3 font-medium">
            Delivered today <span className="num text-app-faint">{doneToday.length}</span>
          </h2>
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {doneToday.map((o) => (
              <JobRow key={o.id} o={o} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, loading, href }: { label: string; value: number; icon: typeof Truck; loading?: boolean; href?: string }) {
  const body = (
    <>
      <dt className="flex items-center gap-1.5 text-ui-sm text-app-muted">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{loading ? <Skeleton className="h-7 w-8" /> : value}</dd>
    </>
  );
  const cls = "rounded-xl p-3.5 shadow-[0_0_0_1px_var(--a-line)] sm:p-4";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-app-hover")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** The job in hand: big, glanceable, one obvious next action. */
function CurrentJob({ o }: { o: Order }) {
  const { advance, busy } = useJobActions();
  const { data: p } = useGetProductQuery(o.productId);
  const step = nextStep(o);
  const m = statusMeta[o.status];
  const toFarm = o.status === "ASSIGNED";
  return (
    <article className="overflow-hidden rounded-2xl bg-app-panel shadow-[0_0_0_1px_var(--a-line),0_12px_32px_-16px_rgb(0_0_0/0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-app-line px-5 py-3">
        <span className={cn("inline-flex items-center gap-1.5 text-ui-sm font-medium", m.color)}>
          <m.icon weight="fill" className="size-4" /> {o.status === "ASSIGNED" ? "Collect from the farm" : "On the way to drop off"}
        </span>
        <Link href={`/jobs/${o.id}`} className="num text-ui-sm text-app-faint hover:text-app-text">
          {orderRef(o.id)} →
        </Link>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[20px] font-medium tracking-[-0.02em]">
              {o.quantity} × {o.productName}
            </p>
            {o.donationId && <DonationTag />}
          </div>
          <div className="mt-4">
            <Route o={o} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
          <MapsLink o={o} toPickup={o.status === "ASSIGNED"} />
          <Link href={`/messages?to=${toFarm ? (p?.farmerId ?? 7) : o.customerId}&name=${encodeURIComponent(toFarm ? (o.farmerName ?? "") : o.customerName)}`} className="inline-flex items-center gap-1.5 text-ui-sm font-medium text-app-muted hover:text-app-text">
            <ChatsCircle className="size-3.5" /> Message {toFarm ? "the farm" : "customer"}
          </Link>
        </div>
      </div>
      {step && (
        <div className="border-t border-app-line bg-app-hover/60 p-3">
          <Button variant="primary" className="h-11 w-full text-[15px]" disabled={busy} onClick={() => advance(o)}>
            {o.status === "ASSIGNED" ? <Package className="size-4" /> : <CheckCircle className="size-4" />} {step.label}
          </Button>
        </div>
      )}
    </article>
  );
}
