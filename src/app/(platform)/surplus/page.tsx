"use client";

import { HandHeart } from "@phosphor-icons/react/dist/ssr";
import { useListSurplusQuery } from "@/lib/api/farmnomad";
import { PageHeader } from "@/components/app/PageHeader";
import { GiveCard, VerifyBanner, useCanClaim, useClaimSurplus } from "@/components/app/give/claim";
import { EmptyState, Skeleton } from "@/components/app/ui";

/** Surplus browse (spec §7.10 /surplus): stock farms have flagged as spare. Claiming takes all of it. */
export default function SurplusBrowsePage() {
  const { data, isLoading } = useListSurplusQuery();
  const { canClaim } = useCanClaim();
  const { claimSurplus, busy } = useClaimSurplus();
  const open = data?.filter((s) => !s.claimedByMe) ?? [];
  const claimed = data?.filter((s) => s.claimedByMe) ?? [];

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader title="Surplus" description="Produce farms nearby won't sell in time. Claim it before it goes to waste." />
      <div className="grid gap-4 px-4 md:px-8">
        <VerifyBanner />
        {isLoading ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </ul>
        ) : !open.length && !claimed.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState icon={<HandHeart className="size-5" />} title="No surplus right now" body="You'll get a notification as soon as a farm near you flags some." />
          </div>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((s) => (
                <GiveCard key={s.id} item={s} kind="surplus" disabled={!canClaim || busy} onClaim={() => claimSurplus(s)} />
              ))}
            </ul>
            {claimed.length > 0 && (
              <>
                <h2 className="mt-4 font-medium">
                  Claimed by you <span className="num text-app-faint">{claimed.length}</span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {claimed.map((s) => (
                    <GiveCard key={s.id} item={s} kind="surplus" onClaim={() => {}} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <p className="text-ui-sm text-app-faint">Claiming surplus takes everything that&apos;s left of that listing. Arrange collection with the farm in Messages.</p>
      </div>
    </div>
  );
}
