"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Gift, HandHeart, SealCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import { useListDonationsQuery, useListSurplusQuery, useMyOrganisationDonationsQuery } from "@/lib/api/farmnomad";
import type { Donation } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { ClaimDonationSheet, GiveCard, VerifyBanner, useCanClaim } from "@/components/app/give/claim";
import { Thumb, orgTypeLabel, verificationMeta } from "@/components/app/give/meta";
import { Pill, Skeleton, relDay } from "@/components/app/ui";

/** Food group home (spec §7.4 /dashboard/organisation). */
export default function OrganisationDashboard() {
  const { org, canClaim } = useCanClaim();
  const { data: open } = useListDonationsQuery();
  const { data: surplus } = useListSurplusQuery();
  const { data: mine } = useMyOrganisationDonationsQuery();
  const [claiming, setClaiming] = useState<Donation | null>(null);

  const available = (open?.length ?? 0) + (surplus?.filter((s) => !s.claimedByMe).length ?? 0);
  const thisMonth = mine?.filter((d) => d.createdAt && new Date(d.createdAt).getMonth() === new Date().getMonth()).reduce((s, d) => s + d.quantity, 0) ?? 0;
  const coming = mine?.filter((d) => d.status === "IN_DELIVERY" || d.status === "CLAIMED") ?? [];
  const v = verificationMeta[org?.verificationLevel ?? "UNVERIFIED"];

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader
        title={org?.name ?? "Your food group"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {org && <span>{orgTypeLabel[org.type]}</span>}
            <Pill tone={v.tone} dot={org?.verificationLevel !== "VERIFIED"}>
              {org?.verificationLevel === "VERIFIED" && <SealCheck weight="fill" className="size-3.5" />}
              {v.label}
            </Pill>
          </span>
        }
      />
      <div className="grid gap-6 px-4 md:px-8">
        <VerifyBanner />

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Available near you" value={open && surplus ? available : null} href="/donations" />
          <Stat label="Units claimed this month" value={mine ? thisMonth : null} href="/donations?tab=mine" />
          <Stat label="On the way or to collect" value={mine ? coming.length : null} href="/donations?tab=mine" />
        </dl>

        <section aria-labelledby="new">
          <Head id="new" title="New donations near you" href="/donations" />
          {!open ? (
            <Skeleton className="h-44 rounded-2xl" />
          ) : open.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {open.slice(0, 3).map((d) => (
                <GiveCard key={d.id} item={d} kind="donation" disabled={!canClaim} onClaim={() => setClaiming(d)} />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl p-5 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">Nothing new right now. We&apos;ll let you know.</p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="coming">
            <Head id="coming" title="Coming your way" href="/donations?tab=mine" />
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {coming.length ? (
                coming.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 border-b border-app-line px-4 py-3 last:border-0">
                    <Thumb src={d.coverImageUrl} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <span className="num">{d.quantity}</span> × {d.productName}
                      </p>
                      <p className="truncate text-ui-sm text-app-faint">{d.farmerName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-ui-sm text-app-muted">
                      {d.status === "IN_DELIVERY" ? <Truck className="size-4 text-app-blue" /> : <HandHeart className="size-4 text-app-blue" />}
                      {d.status === "IN_DELIVERY" ? "Driver delivering" : "To collect"}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-5 text-app-faint">Nothing on the way.</li>
              )}
            </ul>
          </section>

          <section aria-labelledby="surp">
            <Head id="surp" title="Surplus to claim" href="/surplus" />
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {surplus?.filter((s) => !s.claimedByMe).slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center gap-3 border-b border-app-line px-4 py-3 last:border-0">
                  <Thumb src={s.coverImageUrl} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="num">{s.availableQuantity}</span> × {s.productName}
                    </p>
                    <p className="truncate text-ui-sm text-app-faint">
                      {s.farmerName} · {s.createdAt ? relDay(s.createdAt).toLowerCase() : ""}
                    </p>
                  </div>
                  <Link href="/surplus" className="text-ui-sm font-medium text-app-accent hover:underline">
                    View
                  </Link>
                </li>
              )) ?? <li className="p-5"><Skeleton className="h-10" /></li>}
            </ul>
          </section>
        </div>
      </div>
      <ClaimDonationSheet donation={claiming} onClose={() => setClaiming(null)} />
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

function Stat({ label, value, href }: { label: string; value: number | null; href: string }) {
  return (
    <Link href={href} className="rounded-xl p-3.5 shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:bg-app-hover sm:p-4">
      <dt className="flex items-center gap-1.5 text-ui-sm text-app-muted">
        <Gift className="hidden size-3.5 sm:block" /> {label}
      </dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{value === null ? <Skeleton className="h-7 w-10" /> : value}</dd>
    </Link>
  );
}
