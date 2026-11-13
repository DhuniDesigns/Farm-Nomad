"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarBlank, Lock, MapPin, Storefront, Truck } from "@phosphor-icons/react/dist/ssr";
import { useClaimDonationMutation, useClaimSurplusMutation, useMyOrganisationQuery } from "@/lib/api/farmnomad";
import { daysUntil, type Donation, type Surplus } from "@/lib/types/api";
import { Sheet } from "@/components/app/Sheet";
import { Button, relDay } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { Thumb, townOf } from "./meta";

const msg = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "That didn't go through. Try again.";

/** VerificationGuard (spec §8): claims are blocked until the organisation is verified. */
export function useCanClaim() {
  const { data: org, isLoading } = useMyOrganisationQuery();
  return { canClaim: org?.verificationLevel === "VERIFIED", org, isLoading };
}

export function VerifyBanner() {
  const { canClaim, org, isLoading } = useCanClaim();
  if (isLoading || canClaim) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#FFF6E5] p-4 text-[#6B4A00] dark:bg-[#2a2210] dark:text-[#F2C46B]">
      <Lock weight="fill" className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {org ? "We're checking your organisation. You can claim food once it's verified." : "Tell us about your organisation to start claiming food."}
      </p>
      <Link href="/organisations/apply">
        <Button size="sm">{org ? "View status" : "Apply now"}</Button>
      </Link>
    </div>
  );
}

function BestBefore({ iso }: { iso?: string }) {
  if (!iso) return null;
  const d = daysUntil(iso);
  return (
    <span className={cn("inline-flex items-center gap-1", d <= 2 && "text-app-amber")}>
      <CalendarBlank className="size-3.5" /> {d < 0 ? "Past best before" : d === 0 ? "Best before today" : `Best before in ${d}d`}
    </span>
  );
}

/** A donation or surplus card on the food group's browse pages. */
export function GiveCard({ item, kind, onClaim, disabled }: { item: Donation | Surplus; kind: "donation" | "surplus"; onClaim: () => void; disabled?: boolean }) {
  const qty = "availableQuantity" in item && kind === "surplus" ? (item.availableQuantity ?? 0) : item.quantity ?? 0;
  const claimed = kind === "surplus" && (item as Surplus).claimedByMe;
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-app-panel shadow-[0_0_0_1px_var(--a-line)]">
      <div className="flex gap-3.5 p-4">
        <Thumb src={item.coverImageUrl} className="size-16 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">
            {claimed ? "" : <span className="num">{qty} × </span>}
            {item.productName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-ui-sm text-app-muted">
            <Storefront className="size-3.5 shrink-0" /> {item.farmerName}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-ui-sm text-app-faint">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {townOf(item.pickupAddress)}
            </span>
            <BestBefore iso={item.bestBeforeDate} />
          </div>
        </div>
      </div>
      {"note" in item && item.note && <p className="mx-4 -mt-1 mb-3 rounded-lg bg-app-hover px-3 py-2 text-ui-sm text-app-muted">“{item.note}”</p>}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-app-line px-4 py-2.5">
        <span className="text-ui-sm text-app-faint">{item.createdAt ? `Listed ${relDay(item.createdAt).toLowerCase()}` : ""}</span>
        {claimed ? (
          <span className="text-ui-sm font-medium text-app-accent">Claimed by you</span>
        ) : (
          <Button size="sm" variant="primary" onClick={onClaim} disabled={disabled} title={disabled ? "Your organisation needs to be verified first" : undefined}>
            {disabled && <Lock className="size-3.5" />} Claim
          </Button>
        )}
      </div>
    </li>
  );
}

/** Claim a donation: collect it yourself (claim) or have a driver bring it (claim-and-order). */
export function ClaimDonationSheet({ donation, onClose }: { donation: Donation | null; onClose: () => void }) {
  const [claim, { isLoading }] = useClaimDonationMutation();
  const [how, setHow] = useState<"collect" | "deliver">("deliver");
  const [last, setLast] = useState<Donation | null>(donation);
  useEffect(() => {
    if (donation) {
      setLast(donation);
      setHow("deliver");
    }
  }, [donation]);
  const d = donation ?? last;

  async function submit() {
    if (!d) return;
    try {
      await claim({ id: d.id, withDelivery: how === "deliver" }).unwrap();
      toast.success("Claimed", { description: how === "deliver" ? "A local driver will bring it. We'll update you when it's on the way." : `Collect it from ${d.farmerName}. They've been told.` });
      onClose();
    } catch (e) {
      toast.error(msg(e));
    }
  }

  return (
    <Sheet
      open={!!donation}
      onClose={onClose}
      width={440}
      title="Claim donation"
      subtitle={d ? `${d.quantity} × ${d.productName} from ${d.farmerName}` : ""}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={isLoading}>
            {how === "deliver" ? "Claim and book a driver" : "Claim and collect"}
          </Button>
        </>
      }
    >
      {d && (
        <div className="grid gap-5 px-5 py-5">
          <div className="flex items-center gap-3 rounded-xl p-3 shadow-[0_0_0_1px_var(--a-line)]">
            <Thumb src={d.coverImageUrl} className="size-14 rounded-xl" />
            <div className="min-w-0">
              <p className="font-medium">
                <span className="num">{d.quantity}</span> × {d.productName}
              </p>
              <p className="text-ui-sm text-app-faint">{d.pickupAddress}</p>
            </div>
          </div>
          <div role="radiogroup" aria-label="How will you get it?" className="grid gap-2">
            <p className="font-medium">How will you get it?</p>
            {(
              [
                ["deliver", Truck, "Book a local driver", "We send a FarmNomad driver to bring it to your address. No charge for donations."],
                ["collect", Storefront, "We'll collect it", `Pick it up from ${d.farmerName} yourselves.`],
              ] as const
            ).map(([v, Icon, title, body]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={how === v}
                onClick={() => setHow(v)}
                className={cn("flex items-start gap-3 rounded-xl p-3 text-left transition-[box-shadow,background-color]", how === v ? "bg-app-accent-soft shadow-[inset_0_0_0_1.5px_var(--a-accent)]" : "shadow-[inset_0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover")}
              >
                <Icon weight="duotone" className={cn("mt-0.5 size-5 shrink-0", how === v ? "text-app-accent" : "text-app-muted")} />
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-ui-sm text-app-muted">{body}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function useClaimSurplus() {
  const [claim, { isLoading }] = useClaimSurplusMutation();
  return {
    busy: isLoading,
    async claimSurplus(s: Surplus) {
      try {
        await claim(s.productId).unwrap();
        toast.success("Surplus claimed", { description: `${s.availableQuantity} × ${s.productName}. Arrange collection with ${s.farmerName} in Messages.` });
      } catch (e) {
        toast.error(msg(e));
      }
    },
  };
}
