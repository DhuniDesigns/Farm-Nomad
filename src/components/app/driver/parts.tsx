"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ArrowSquareOut, CheckCircle, Gift, HandTap, NavigationArrow, Package, Storefront, Truck } from "@phosphor-icons/react/dist/ssr";
import { useAssignOrderMutation, useUpdateOrderStatusMutation } from "@/lib/api/farmnomad";
import type { Order } from "@/lib/types/api";
import { statusMeta } from "@/components/app/orderMeta";
import { Button, Pill, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const err = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "That didn't work. Try again.";

/** Google Maps directions between the two ends of a job (opens the Maps app on phones). */
export const mapsUrl = (o: Order, from?: "pickup") =>
  `https://www.google.com/maps/dir/?api=1&${from ? "" : `origin=${encodeURIComponent(o.pickupAddress ?? "")}&`}destination=${encodeURIComponent((from ? o.pickupAddress : o.deliveryAddress) ?? "")}&travelmode=driving`;

/** What the driver should do next for a job, and how to word it. */
export function nextStep(o: Order) {
  if (o.status === "PENDING" && !o.driverId) return { label: "Accept job", hint: "Collect from the farm, deliver to the door." };
  if (o.status === "ASSIGNED") return { label: "Mark as collected", hint: `Head to ${o.farmerName ?? "the farm"} to collect.` };
  if (o.status === "IN_TRANSIT") return { label: "Mark as delivered", hint: `Drop off with ${o.customerName}.` };
  return null;
}

export function useJobActions() {
  const [assign, a] = useAssignOrderMutation();
  const [status, s] = useUpdateOrderStatusMutation();
  async function advance(o: Order) {
    try {
      if (o.status === "PENDING") {
        await assign(o.id).unwrap();
        toast.success("Job accepted", { description: `Collect ${o.productName} from ${o.farmerName ?? "the farm"}.` });
      } else if (o.status === "ASSIGNED") {
        await status({ id: o.id, status: "IN_TRANSIT" }).unwrap();
        toast.success("Collected", { description: `${o.customerName} has been told you're on the way.` });
      } else if (o.status === "IN_TRANSIT") {
        await status({ id: o.id, status: "DELIVERED" }).unwrap();
        toast.success("Delivered", { description: `${orderRef(o.id)} is complete. Nice one.` });
      }
    } catch (e) {
      toast.error(err(e));
    }
  }
  return { advance, busy: a.isLoading || s.isLoading };
}

/** Pickup → drop-off, drawn as a short vertical route. */
export function Route({ o, compact }: { o: Order; compact?: boolean }) {
  const collected = o.status === "IN_TRANSIT" || o.status === "DELIVERED";
  return (
    <ol className={cn("relative grid", compact ? "gap-2" : "gap-4")}>
      <span aria-hidden className={cn("absolute left-[11px] w-px", compact ? "bottom-3 top-3" : "bottom-5 top-5", collected ? "bg-app-accent" : "bg-[repeating-linear-gradient(180deg,var(--a-line-strong)_0_4px,transparent_4px_8px)]")} />
      <li className="relative flex gap-3">
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", collected ? "bg-app-accent text-white dark:text-black" : "bg-app-panel shadow-[inset_0_0_0_1.5px_var(--a-line-strong)] text-app-muted")}>
          {collected ? <CheckCircle weight="fill" className="size-3.5" /> : <Storefront weight="bold" className="size-3" />}
        </span>
        <div className="min-w-0">
          <p className={cn("font-medium", compact && "text-ui")}>{o.farmerName ?? "Farm"}</p>
          {!compact && <p className="text-ui-sm text-app-faint">{o.pickupAddress ?? "Address to confirm"}</p>}
        </div>
      </li>
      <li className="relative flex gap-3">
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", o.status === "DELIVERED" ? "bg-app-accent text-white dark:text-black" : "bg-app-primary text-app-on-primary")}>
          {o.status === "DELIVERED" ? <CheckCircle weight="fill" className="size-3.5" /> : <NavigationArrow weight="fill" className="size-3" />}
        </span>
        <div className="min-w-0">
          <p className={cn("font-medium", compact && "text-ui")}>{o.customerName}</p>
          {!compact && <p className="text-ui-sm text-app-faint">{o.deliveryAddress ?? "Address to confirm"}</p>}
        </div>
      </li>
    </ol>
  );
}

export function DonationTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EEFB] px-2 py-0.5 text-ui-sm font-medium text-[#6B3FA0] dark:bg-[#231a30] dark:text-[#C9A8F0]">
      <Gift weight="fill" className="size-3" /> Donation run
    </span>
  );
}

/** Row in the jobs lists. Whole row opens the job; the button does the next step without leaving. */
export function JobRow({ o }: { o: Order }) {
  const { advance, busy } = useJobActions();
  const step = nextStep(o);
  const m = statusMeta[o.status];
  return (
    <li className="group relative flex flex-col gap-3 border-b border-app-line px-4 py-4 last:border-0 sm:flex-row sm:items-center md:px-5">
      <Link href={`/jobs/${o.id}`} className="absolute inset-0" aria-label={`Open job ${orderRef(o.id)}`} />
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-app-hover">
          <m.icon weight="fill" className={cn("size-4", o.status === "PENDING" ? "text-app-muted" : m.color)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {o.quantity} × {o.productName}
            </p>
            {o.donationId && <DonationTag />}
          </div>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-ui-sm text-app-muted">
            <span className="truncate">{o.farmerName}</span>
            <ArrowRight className="size-3 shrink-0 text-app-faint" />
            <span className="truncate">{o.deliveryAddress?.split(",").slice(-1)[0]?.trim() ?? o.customerName}</span>
          </p>
          <p className="num mt-0.5 text-ui-sm text-app-faint">
            {orderRef(o.id)} · {relDay(o.updatedAt ?? o.createdAt)}, {time(o.updatedAt ?? o.createdAt)}
          </p>
        </div>
      </div>
      <div className="relative flex items-center gap-2 sm:justify-end">
        {step ? (
          <Button variant={o.status === "PENDING" ? "primary" : "secondary"} size="sm" disabled={busy} onClick={() => advance(o)} className="w-full sm:w-auto">
            {o.status === "PENDING" ? <HandTap className="size-4" /> : o.status === "ASSIGNED" ? <Package className="size-4" /> : <Truck className="size-4" />}
            {step.label}
          </Button>
        ) : (
          <Pill tone={m.tone}>{m.short}</Pill>
        )}
      </div>
    </li>
  );
}

export function MapsLink({ o, toPickup }: { o: Order; toPickup?: boolean }) {
  return (
    <a href={mapsUrl(o, toPickup ? "pickup" : undefined)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ui-sm font-medium text-app-accent hover:underline">
      <ArrowSquareOut className="size-3.5" /> {toPickup ? "Directions to the farm" : "Open route in Maps"}
    </a>
  );
}
