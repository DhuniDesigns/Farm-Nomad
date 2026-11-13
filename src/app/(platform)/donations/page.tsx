"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Gift, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { useListDonationsQuery, useMyOrganisationDonationsQuery } from "@/lib/api/farmnomad";
import type { Donation, DonationStatus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { ClaimDonationSheet, GiveCard, VerifyBanner, useCanClaim } from "@/components/app/give/claim";
import { Thumb, donationMeta } from "@/components/app/give/meta";
import { EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Tab = "open" | "mine";

/** Food group donations (spec §7.10 /donations): what farms are giving away, and what you've claimed. */
export default function DonationsPage() {
  const [tab, setTab] = useState<Tab>("open");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "mine") setTab("mine");
  }, []);
  const { data: open, isLoading: l1 } = useListDonationsQuery();
  const { data: mine, isLoading: l2 } = useMyOrganisationDonationsQuery();
  const { canClaim } = useCanClaim();
  const [claiming, setClaiming] = useState<Donation | null>(null);

  const select = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "open" ? "/donations" : "/donations?tab=mine");
  };

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader title="Donations" description="Free produce from farms near you. Claim it, then collect or book a driver." />
      <div className="grid gap-4 px-4 md:px-8">
        <VerifyBanner />
        <div role="tablist" aria-label="Donations" className="flex gap-1 border-b border-app-line">
          {(
            [
              ["open", "Open to claim", open?.length],
              ["mine", "Our claims", mine?.length],
            ] as const
          ).map(([t, label, n]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => select(t)} className={cn("relative -mb-px flex h-10 items-center gap-1.5 px-3 font-medium transition-colors", tab === t ? "text-app-text" : "text-app-faint hover:text-app-muted")}>
              {label}
              {!!n && <span className="num rounded-full bg-app-hover px-1.5 text-ui-sm text-app-muted">{n}</span>}
              {tab === t && <motion.span layoutId="don-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-app-text" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />}
            </button>
          ))}
        </div>

        {tab === "open" ? (
          l1 ? (
            <Grid>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</Grid>
          ) : !open?.length ? (
            <Empty icon={<Gift className="size-5" />} title="Nothing to claim right now" body="Farms near you are told to list spare produce here. You'll get a notification when they do." />
          ) : (
            <Grid>
              {open.map((d) => (
                <GiveCard key={d.id} item={d} kind="donation" disabled={!canClaim} onClaim={() => setClaiming(d)} />
              ))}
            </Grid>
          )
        ) : l2 ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : !mine?.length ? (
          <Empty icon={<HandHeart className="size-5" />} title="No claims yet" body="Donations you claim are tracked here until they arrive." />
        ) : (
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {mine.map((d) => {
              const m = donationMeta[(d.status ?? "PENDING") as DonationStatus];
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-app-line px-5 py-4 last:border-0">
                  <Thumb src={d.coverImageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="num">{d.quantity}</span> × {d.productName}
                    </p>
                    <p className="truncate text-ui-sm text-app-faint">
                      From {d.farmerName} · {d.createdAt ? relDay(d.createdAt).toLowerCase() : ""}
                    </p>
                  </div>
                  <Pill tone={m.tone}>{m.label}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ClaimDonationSheet donation={claiming} onClose={() => setClaiming(null)} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>;
}

function Empty(props: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
      <EmptyState {...props} />
    </div>
  );
}
