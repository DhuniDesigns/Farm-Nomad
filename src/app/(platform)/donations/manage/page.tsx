"use client";

import Link from "next/link";
import { Gift, HandHeart, Plus, Storefront, Truck } from "@phosphor-icons/react/dist/ssr";
import { useMyFarmerDonationsQuery } from "@/lib/api/farmnomad";
import type { DonationStatus } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import { Thumb, donationMeta } from "@/components/app/give/meta";
import { Button, EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";

/** Farmer donations (spec §7.10 /donations/manage): what you've given, and to whom. */
export default function DonationsManagePage() {
  const { data, isLoading } = useMyFarmerDonationsQuery();
  const { setDonateSheet } = useApp();

  const units = data?.reduce((s, d) => s + d.quantity, 0) ?? 0;
  const groups = new Set(data?.map((d) => d.organisationName).filter(Boolean)).size;
  const waiting = data?.filter((d) => d.status === "PENDING").length ?? 0;

  return (
    <div className="mx-auto max-w-[1000px] pb-16">
      <PageHeader
        title="Donations"
        description="Produce you've given to food banks, schools and community groups nearby."
        actions={
          <Button variant="primary" onClick={() => setDonateSheet({})}>
            <Plus weight="bold" className="size-3.5" /> Donate produce
          </Button>
        }
      />

      <div className="grid gap-4 px-4 md:px-8">
        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Units donated" value={data ? units : null} />
          <Stat label="Groups helped" value={data ? groups : null} />
          <Stat label="Waiting for a claim" value={data ? waiting : null} />
        </dl>

        <section className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Your donations">
          {isLoading ? (
            <div className="grid gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.length ? (
            <EmptyState
              icon={<Gift className="size-5" />}
              title="No donations yet"
              body="Give produce you can't sell to groups who'll use it. They claim it and collect, or book a local driver."
              action={<Button variant="primary" onClick={() => setDonateSheet({})}>Donate produce</Button>}
            />
          ) : (
            <ul>
              {data.map((d) => {
                const m = donationMeta[(d.status ?? "PENDING") as DonationStatus];
                return (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-app-line px-5 py-4 last:border-0">
                    <Thumb src={d.coverImageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <span className="num">{d.quantity}</span> × {d.productName}
                      </p>
                      <p className="truncate text-ui-sm text-app-faint">
                        {d.organisationName ? `To ${d.organisationName}` : "Not claimed yet"} · listed {d.createdAt ? relDay(d.createdAt).toLowerCase() : ""}
                      </p>
                      {d.note && <p className="mt-1 truncate text-ui-sm text-app-muted">“{d.note}”</p>}
                    </div>
                    <Pill tone={m.tone}>{m.farmer}</Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="grid gap-3 rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] sm:grid-cols-3" aria-labelledby="how">
          <h2 id="how" className="font-medium sm:col-span-3">
            How donations work
          </h2>
          <Step icon={Gift} title="You list it" body="Pick a product and how much. It comes off your marketplace stock." />
          <Step icon={HandHeart} title="A verified group claims it" body="Food banks, schools, faith and student groups near you are told straight away." />
          <Step icon={Truck} title="Collected or delivered" body="They collect from the farm, or book a local driver to bring it." />
          <p className="text-ui-sm text-app-faint sm:col-span-3">
            Have stock that might not sell but isn&apos;t free?{" "}
            <Link href="/surplus/manage" className="font-medium text-app-text underline underline-offset-2">
              Flag it as surplus
            </Link>{" "}
            instead. Buyers can also find cheaper surplus deals on the{" "}
            <Link href="/marketplace" className="inline-flex items-center gap-1 font-medium text-app-text underline underline-offset-2">
              <Storefront className="size-3.5" /> marketplace
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
      <dt className="text-ui-sm text-app-muted">{label}</dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{value === null ? <Skeleton className="h-7 w-10" /> : value}</dd>
    </div>
  );
}

function Step({ icon: Icon, title, body }: { icon: typeof Gift; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-app-accent-soft text-app-accent">
        <Icon weight="duotone" className="size-4" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-ui-sm text-app-muted">{body}</p>
      </div>
    </div>
  );
}
