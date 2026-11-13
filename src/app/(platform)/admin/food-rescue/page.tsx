"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift } from "@phosphor-icons/react/dist/ssr";
import { useAllDonationsAdminQuery, useAssignSurplusMutation, useListOrganisationsQuery, useListSurplusQuery } from "@/lib/api/farmnomad";
import type { DonationStatus, Surplus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Filters, Table, td, tr } from "@/components/app/admin/parts";
import { Thumb, donationMeta } from "@/components/app/give/meta";
import { EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";

type F = "all" | DonationStatus;

/**
 * Food rescue: every donation (spec §3.9 GET /donations/all) and surplus nobody has claimed yet,
 * which an admin can hand to a verified group (spec §3.10 POST /surplus/assign/{productId}).
 */
export default function FoodRescue() {
  const { data: donations, isLoading } = useAllDonationsAdminQuery();
  const { data: surplus } = useListSurplusQuery();
  const { data: orgs } = useListOrganisationsQuery();
  const [assign, { isLoading: busy }] = useAssignSurplusMutation();
  const [f, setF] = useState<F>("all");
  const verified = orgs?.filter((o) => o.verificationLevel === "VERIFIED") ?? [];
  const open = surplus?.filter((s) => !s.claimedByMe && (s.availableQuantity ?? 0) > 0) ?? [];
  const rows = useMemo(() => (donations ?? []).filter((d) => f === "all" || d.status === f), [donations, f]);

  const given = donations?.reduce((s, d) => s + d.quantity, 0) ?? 0;
  const delivered = donations?.filter((d) => d.status === "DELIVERED").reduce((s, d) => s + d.quantity, 0) ?? 0;
  const waiting = donations?.filter((d) => d.status === "PENDING").length ?? 0;

  async function give(s: Surplus, userId: number) {
    const org = verified.find((o) => o.userId === userId);
    try {
      await assign({ productId: s.productId, organisationUserId: userId }).unwrap();
      toast.success(`${s.productName} assigned`, { description: `${org?.name} has been told to collect it from ${s.farmerName}.` });
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "Couldn't assign that surplus");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Food rescue" description="Donations and surplus moving from farms to food groups." />
      <div className="grid gap-6 px-4 md:px-8">
        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {(
            [
              ["Units donated", donations ? given : null],
              ["Units delivered", donations ? delivered : null],
              ["Waiting for a group", donations ? waiting : null],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
              <dt className="text-ui-sm text-app-muted">{k}</dt>
              <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{v === null ? <Skeleton className="h-7 w-10" /> : v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="surp">
          <h2 id="surp" className="font-medium">
            Unclaimed surplus <span className="num text-app-faint">{open.length}</span>
          </h2>
          <p className="mb-3 mt-0.5 text-ui-sm text-app-faint">If nobody claims it in time, hand it to a verified group yourself.</p>
          {!surplus ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : !open.length ? (
            <p className="rounded-xl p-5 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">Every piece of surplus has been claimed.</p>
          ) : (
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {open.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-app-line px-5 py-3 last:border-0">
                  <Thumb src={s.coverImageUrl} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="num">{s.availableQuantity}</span> × {s.productName}
                    </p>
                    <p className="truncate text-ui-sm text-app-faint">
                      {s.farmerName} · flagged {s.createdAt ? relDay(s.createdAt).toLowerCase() : ""}
                    </p>
                  </div>
                  <select
                    aria-label={`Assign ${s.productName} to`}
                    defaultValue=""
                    disabled={busy}
                    onChange={(e) => e.target.value && give(s, Number(e.target.value))}
                    className="h-8 rounded-[7px] bg-app-panel px-2 text-ui shadow-[0_0_0_1px_var(--a-line-strong)] outline-none focus:shadow-[0_0_0_1px_var(--a-accent)]"
                  >
                    <option value="">Assign to…</option>
                    {verified.map((o) => (
                      <option key={o.id} value={o.userId}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="dons" className="grid gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 id="dons" className="font-medium">
              All donations
            </h2>
            <Filters
              id="dons"
              value={f}
              onChange={setF}
              options={[{ id: "all" as F, label: "All", n: donations?.length }, ...(["PENDING", "CLAIMED", "IN_DELIVERY", "DELIVERED"] as DonationStatus[]).map((s) => ({ id: s as F, label: donationMeta[s].label, n: donations?.filter((d) => d.status === s).length }))]}
            />
          </div>
          <Table
            head={["Donation", "From", "To", "Listed", "Status"]}
            loading={isLoading}
            empty={!rows.length && !isLoading ? <EmptyState icon={<Gift className="size-5" />} title="Nothing here" body="Donations with this status show up here." /> : undefined}
          >
            {rows.map((d) => {
              const m = donationMeta[(d.status ?? "PENDING") as DonationStatus];
              return (
                <tr key={d.id} className={tr}>
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <Thumb src={d.coverImageUrl} className="size-9" />
                      <span className="font-medium">
                        <span className="num">{d.quantity}</span> × {d.productName}
                      </span>
                    </span>
                  </td>
                  <td className={td + " text-app-muted"}>{d.farmerName}</td>
                  <td className={td + " text-app-muted"}>{d.organisationName ?? <span className="text-app-faint">Not claimed</span>}</td>
                  <td className={td + " text-ui-sm text-app-muted"}>{d.createdAt ? relDay(d.createdAt) : "–"}</td>
                  <td className={td}>
                    <Pill tone={m.tone}>{m.label}</Pill>
                  </td>
                </tr>
              );
            })}
          </Table>
        </section>
      </div>
    </div>
  );
}
