"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatsCircle, CloudSun, Scan, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { confidencePct, useAllCropScansQuery, useDeleteCropScanMutation } from "@/lib/api/cropScan.api";
import type { CropScan, ScanSeverity } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Confirm, Filters, Search } from "@/components/app/admin/parts";
import { DiagnosisResult, severityMeta } from "@/components/app/farm-tools/DiagnosisResult";
import { Sheet } from "@/components/app/Sheet";
import { Button, EmptyState, Pill, Skeleton, relDay } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type F = "all" | "problems" | ScanSeverity;
const DAY = 86400000;
const isHealthy = (s: CropScan) => s.healthy ?? /healthy/i.test(s.diagnosis);
const sevOf = (s: CropScan): ScanSeverity => s.severity ?? (isHealthy(s) ? "NONE" : "MODERATE");
const match: Record<F, (s: CropScan) => boolean> = {
  all: () => true,
  problems: (s) => !isHealthy(s),
  HIGH: (s) => sevOf(s) === "HIGH",
  MODERATE: (s) => sevOf(s) === "MODERATE",
  LOW: (s) => sevOf(s) === "LOW",
  NONE: (s) => sevOf(s) === "NONE",
};

/**
 * Admin crop scans: every farmer's diagnoses, to help a farmer who asks, remove a wrong or
 * unsuitable photo (DELETE /crop-scans/{id} as ADMIN), and spot a disease turning up on several
 * farms at once. List endpoint assumed: GET /crop-scans?farmerId= (not in the spec yet).
 */
export default function AdminCropScans() {
  const [farmerId, setFarmerId] = useState<number | undefined>(() => (typeof window === "undefined" ? undefined : Number(new URLSearchParams(window.location.search).get("farmerId")) || undefined));
  const [now] = useState(() => Date.now());
  const { data, isLoading } = useAllCropScansQuery(farmerId ? { farmerId } : undefined);
  const [del, { isLoading: deleting }] = useDeleteCropScanMutation();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<CropScan | null>(null);
  const [removing, setRemoving] = useState<CropScan | null>(null);

  const rows = useMemo(() => (data ?? []).filter((s) => match[f](s) && `${s.diagnosis} ${s.crop ?? ""} ${s.farmerName ?? ""} ${s.farmerPostcode ?? ""}`.toLowerCase().includes(q.toLowerCase())), [data, f, q]);
  const farmerName = farmerId ? data?.[0]?.farmerName : undefined;

  // Early warning: the same disease on 2+ farms in the last 14 days.
  const clusters = useMemo(() => {
    const recent = (data ?? []).filter((s) => !isHealthy(s) && now - +new Date(s.createdAt) < 14 * DAY);
    const by = new Map<string, CropScan[]>();
    recent.forEach((s) => by.set(s.diagnosis, [...(by.get(s.diagnosis) ?? []), s]));
    return [...by]
      .map(([diagnosis, scans]) => ({ diagnosis, scans, farms: [...new Set(scans.map((s) => s.farmerName))], areas: [...new Set(scans.map((s) => s.farmerPostcode?.split(" ")[0]).filter(Boolean))] }))
      .filter((c) => c.farms.length >= 2)
      .sort((a, b) => b.scans.length - a.scans.length);
  }, [data, now]);

  const week = data?.filter((s) => now - +new Date(s.createdAt) < 7 * DAY) ?? [];
  const clearFarmer = () => {
    setFarmerId(undefined);
    window.history.replaceState(null, "", "/admin/crop-scans");
  };

  async function remove() {
    if (!removing) return;
    try {
      await del(removing.id).unwrap();
      toast("Scan deleted", { description: `${removing.farmerName} won't see it in their history any more.` });
      setRemoving(null);
      setOpen(null);
    } catch {
      toast.error("Couldn't delete that scan");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Crop scans" description="Every farmer's leaf diagnoses. Help a farmer, remove a bad photo, and catch a disease that's spreading." />
      <div className="grid gap-6 px-4 md:px-8">
        {farmerId && (
          <div className="flex items-center gap-2 self-start rounded-full bg-app-hover py-1 pl-3 pr-1 text-ui-sm">
            Showing <span className="font-medium">{farmerName ?? "one farmer"}</span>
            <button onClick={clearFarmer} aria-label="Show every farmer" className="grid size-6 place-items-center rounded-full text-app-muted transition-colors hover:bg-app-active hover:text-app-text">
              <X weight="bold" className="size-3" />
            </button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {(
            [
              ["Scans this week", data ? week.length : null],
              ["Problems found this week", data ? week.filter((s) => !isHealthy(s)).length : null],
              ["Severe, all time", data ? data.filter((s) => sevOf(s) === "HIGH").length : null],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
              <dt className="text-ui-sm text-app-muted">{k}</dt>
              <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{v === null ? <Skeleton className="h-7 w-10" /> : v}</dd>
            </div>
          ))}
        </dl>

        {!farmerId && clusters.length > 0 && (
          <section aria-labelledby="watch" className="rounded-xl bg-app-amber-soft p-4">
            <h2 id="watch" className="flex items-center gap-2 font-medium text-app-amber">
              <Warning weight="fill" className="size-4" /> Turning up on several farms
            </h2>
            <ul className="mt-3 grid gap-2">
              {clusters.map((c) => (
                <li key={c.diagnosis} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-app-panel px-3.5 py-2.5 shadow-[0_0_0_1px_var(--a-line)]">
                  <span className="font-medium">{c.diagnosis}</span>
                  <span className="text-ui-sm text-app-muted">
                    <span className="num">{c.scans.length}</span> scans on <span className="num">{c.farms.length}</span> farms in 14 days · {c.areas.join(", ")}
                  </span>
                  <span className="text-ui-sm text-app-faint">{c.farms.join(", ")}</span>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setQ(c.diagnosis)}>
                    Show scans
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-ui-sm text-app-muted">Worth messaging nearby farms so they can check their crops.</p>
          </section>
        )}

        <div className="grid gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Filters
              id="scans"
              value={f}
              onChange={setF}
              options={(
                [
                  ["all", "All"],
                  ["problems", "Problems"],
                  ["HIGH", "Severe"],
                  ["MODERATE", "Moderate"],
                  ["LOW", "Mild"],
                  ["NONE", "Healthy"],
                ] as [F, string][]
              ).map(([id, label]) => ({ id, label, n: data?.filter(match[id]).length }))}
            />
            <Search value={q} onChange={setQ} placeholder="Search disease, farm or area" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : !rows.length ? (
            <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              <EmptyState icon={<Scan className="size-5" />} title={data?.length ? "No scans match" : "No scans yet"} body={data?.length ? "Try another filter or clear the search." : "Scans appear here as farmers use the crop scanner."} />
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map((s) => {
                const sev = severityMeta[sevOf(s)];
                return (
                  <li key={s.id}>
                    <button onClick={() => setOpen(s)} className="group block w-full overflow-hidden rounded-xl text-left shadow-[0_0_0_1px_var(--a-line)] transition-shadow hover:shadow-[0_0_0_1px_var(--a-line-strong),0_8px_20px_-12px_rgb(0_0_0/0.2)]">
                      <div className="relative aspect-[4/3] overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element -- hosted scan photos of any size */}
                        <img src={s.imageUrl} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        <span className="absolute left-2 top-2 rounded-full bg-app-panel shadow-[0_1px_2px_rgb(0_0_0/0.25)]">
                          <Pill tone={sev.tone}>{sev.label}</Pill>
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="truncate font-medium">{isHealthy(s) ? "Healthy" : s.diagnosis}</p>
                        <p className="mt-0.5 truncate text-ui-sm text-app-muted">
                          {s.crop ? `${s.crop} · ` : ""}
                          {s.farmerName}
                        </p>
                        <p className="mt-0.5 text-ui-sm text-app-faint">
                          <span className={cn("num", confidencePct(s.confidence) < 60 && "text-app-amber")}>{confidencePct(s.confidence)}%</span> · {relDay(s.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} width={520} title={open?.farmerName ?? "Scan"} subtitle={open?.farmerPostcode}>
        {open && (
          <div className="grid gap-5 px-5 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- hosted scan photo */}
            <img src={open.imageUrl} alt="The farmer's photo" className="aspect-[4/3] w-full rounded-xl bg-black object-contain" />
            <div className="flex flex-wrap gap-2">
              {open.farmerId && (
                <Link href={`/messages?to=${open.farmerId}&name=${encodeURIComponent(open.farmerName ?? "")}`}>
                  <Button>
                    <ChatsCircle className="size-4" /> Message farmer
                  </Button>
                </Link>
              )}
              {open.farmerPostcode && (
                <Link href={`/weather?postcode=${encodeURIComponent(open.farmerPostcode)}`}>
                  <Button variant="ghost">
                    <CloudSun className="size-4" /> Weather at the farm
                  </Button>
                </Link>
              )}
              {open.farmerId && !farmerId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFarmerId(open.farmerId);
                    setOpen(null);
                    window.history.replaceState(null, "", `/admin/crop-scans?farmerId=${open.farmerId}`);
                  }}
                >
                  All their scans
                </Button>
              )}
            </div>
            <DiagnosisResult scan={open} deleting={deleting} onDelete={() => setRemoving(open)} />
          </div>
        )}
      </Sheet>

      <Confirm
        open={!!removing}
        title="Delete this scan?"
        body={`It's removed from ${removing?.farmerName}'s history too. Use this for wrong or unsuitable photos.`}
        action="Delete scan"
        danger
        busy={deleting}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
