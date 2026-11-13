"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowSquareOut, ChatsCircle, Check, SealCheck, X } from "@phosphor-icons/react/dist/ssr";
import { useListOrganisationsQuery, useListUsersQuery, useVerifyOrganisationMutation } from "@/lib/api/farmnomad";
import type { Organisation, VerificationLevel } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Confirm, Filters } from "@/components/app/admin/parts";
import { orgTypeLabel, verificationMeta } from "@/components/app/give/meta";
import { Button, EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";

type F = "PENDING" | "VERIFIED" | "UNVERIFIED";

/**
 * Spec §7.11 /admin/verifications: approve or turn down food groups before they can claim.
 * Real API: PUT /organisations/{id} updating verificationLevel (field name to confirm).
 */
export default function Verifications() {
  const { data, isLoading } = useListOrganisationsQuery();
  const { data: users } = useListUsersQuery();
  const [verify, { isLoading: busy }] = useVerifyOrganisationMutation();
  const [f, setF] = useState<F>("PENDING");
  const [rejecting, setRejecting] = useState<Organisation | null>(null);
  const rows = (data ?? []).filter((o) => (o.verificationLevel ?? "UNVERIFIED") === f);

  async function decide(o: Organisation, level: VerificationLevel) {
    try {
      await verify({ id: o.id, verificationLevel: level }).unwrap();
      setRejecting(null);
      toast.success(level === "VERIFIED" ? `${o.name} is verified` : `${o.name} was turned down`, { description: level === "VERIFIED" ? "They can claim donations and surplus now." : "They've been asked to check their details and apply again." });
    } catch {
      toast.error("Couldn't update that organisation");
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] pb-16">
      <PageHeader title="Verifications" description="Check each food group is real before it can claim food from farms." />
      <div className="grid gap-4 px-4 md:px-8">
        <Filters
          id="verif"
          value={f}
          onChange={setF}
          options={[
            { id: "PENDING" as F, label: "Waiting", n: data?.filter((o) => o.verificationLevel === "PENDING").length },
            { id: "VERIFIED" as F, label: "Verified", n: data?.filter((o) => o.verificationLevel === "VERIFIED").length },
            { id: "UNVERIFIED" as F, label: "Turned down", n: data?.filter((o) => (o.verificationLevel ?? "UNVERIFIED") === "UNVERIFIED").length },
          ]}
        />
        {isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : !rows.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState icon={<SealCheck className="size-5" />} title={f === "PENDING" ? "No one waiting" : "Nothing here"} body={f === "PENDING" ? "New applications show up here for review." : "Organisations with this status show up here."} />
          </div>
        ) : (
          <ul className="grid gap-3">
            {rows.map((o) => {
              const contact = users?.find((u) => u.id === o.userId);
              const v = verificationMeta[o.verificationLevel ?? "UNVERIFIED"];
              return (
                <li key={o.id} className="rounded-xl bg-app-panel p-5 shadow-[0_0_0_1px_var(--a-line)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-[18px] font-medium tracking-[-0.02em]">{o.name}</p>
                      <p className="text-ui-sm text-app-muted">
                        {orgTypeLabel[o.type]} · applied {o.createdAt ? relDay(o.createdAt).toLowerCase() : ""}
                      </p>
                    </div>
                    <Pill tone={v.tone}>{o.verificationLevel === "PENDING" ? "Waiting for review" : o.verificationLevel === "VERIFIED" ? "Verified" : "Turned down"}</Pill>
                  </div>
                  {o.description && <p className="mt-3 text-app-muted">{o.description}</p>}
                  <dl className="mt-4 grid gap-2 rounded-lg bg-app-hover/60 p-3 text-ui-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-app-faint">Charity number</dt>
                      <dd className="mt-0.5 flex items-center gap-2">
                        {o.charityNumber ? (
                          <>
                            <span className="num">{o.charityNumber}</span>
                            <a href="https://register-of-charities.charitycommission.gov.uk/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-app-accent hover:underline">
                              Check register <ArrowSquareOut className="size-3" />
                            </a>
                          </>
                        ) : (
                          <span className="text-app-faint">Not given · check by phone</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-app-faint">Contact</dt>
                      <dd className="mt-0.5 truncate">{contact ? `${contact.fullName} · ${contact.email}` : "–"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {o.verificationLevel !== "VERIFIED" && (
                      <Button variant="primary" disabled={busy} onClick={() => decide(o, "VERIFIED")}>
                        <Check weight="bold" className="size-3.5" /> Approve
                      </Button>
                    )}
                    {o.verificationLevel === "PENDING" && (
                      <Button variant="ghost" className="text-app-red" onClick={() => setRejecting(o)}>
                        <X weight="bold" className="size-3.5" /> Turn down
                      </Button>
                    )}
                    {o.verificationLevel === "VERIFIED" && (
                      <Button variant="ghost" onClick={() => setRejecting(o)}>
                        Remove verification
                      </Button>
                    )}
                    {contact && (
                      <Link href={`/messages?to=${contact.id}&name=${encodeURIComponent(contact.fullName)}`} className="ml-auto">
                        <Button variant="ghost">
                          <ChatsCircle className="size-4" /> Ask a question
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Confirm
        open={!!rejecting}
        title={rejecting?.verificationLevel === "VERIFIED" ? `Remove ${rejecting?.name}'s verification?` : `Turn down ${rejecting?.name}?`}
        body={rejecting?.verificationLevel === "VERIFIED" ? "They won't be able to claim food until they're verified again." : "They'll be asked to check their details and apply again. You can approve them later."}
        action={rejecting?.verificationLevel === "VERIFIED" ? "Remove verification" : "Turn down"}
        danger
        busy={busy}
        onConfirm={() => rejecting && decide(rejecting, "UNVERIFIED")}
        onClose={() => setRejecting(null)}
      />
    </div>
  );
}
