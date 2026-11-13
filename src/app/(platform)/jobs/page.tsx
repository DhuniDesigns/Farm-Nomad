"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { MapTrifold, Truck } from "@phosphor-icons/react/dist/ssr";
import { useAssignedOrdersQuery, useUnassignedOrdersQuery } from "@/lib/api/farmnomad";
import { JobRow } from "@/components/app/driver/parts";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Tab = "mine" | "available" | "done";

/** Driver jobs: what I've taken (spec GET /orders/assigned) and what's waiting (GET /orders/unassigned). */
export default function JobsPage() {
  const [tab, setTab] = useState<Tab>("mine");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "available" || t === "done") setTab(t);
  }, []);
  const { data: mine, isLoading: l1 } = useAssignedOrdersQuery(undefined, { pollingInterval: 15000 });
  const { data: open, isLoading: l2 } = useUnassignedOrdersQuery(undefined, { pollingInterval: 15000 });

  const active = (mine ?? []).filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT").sort((a, b) => (a.status === "IN_TRANSIT" ? -1 : 0) - (b.status === "IN_TRANSIT" ? -1 : 0));
  const done = (mine ?? []).filter((o) => o.status === "DELIVERED");
  const list = tab === "mine" ? active : tab === "available" ? (open ?? []) : done;
  const loading = tab === "available" ? l2 : l1;

  const tabs: [Tab, string, number | undefined][] = [
    ["mine", "My jobs", active.length],
    ["available", "Available", open?.length],
    ["done", "Completed", done.length],
  ];

  const select = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "mine" ? "/jobs" : `/jobs?tab=${t}`);
  };

  return (
    <div className="mx-auto max-w-[920px] pb-16">
      <PageHeader title="Jobs" description="Collect from the farm, deliver to the door. Tap a job for the full route." />
      <div className="px-4 md:px-8">
        <div role="tablist" aria-label="Jobs" className="mb-4 flex gap-1 border-b border-app-line">
          {tabs.map(([t, label, n]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => select(t)} className={cn("relative -mb-px flex h-10 items-center gap-1.5 px-3 font-medium transition-colors", tab === t ? "text-app-text" : "text-app-faint hover:text-app-muted")}>
              {label}
              {!!n && <span className="num rounded-full bg-app-hover px-1.5 text-ui-sm text-app-muted">{n}</span>}
              {tab === t && <motion.span layoutId="jobs-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-app-text" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !list.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {tab === "available" ? (
              <EmptyState icon={<MapTrifold className="size-5" />} title="Nothing waiting right now" body="When a farm packs an order near you, it shows up here first." />
            ) : tab === "mine" ? (
              <EmptyState icon={<Truck className="size-5" />} title="No jobs in hand" body="Pick one up from Available. Accepted jobs stay here until they're delivered." />
            ) : (
              <EmptyState icon={<Truck className="size-5" />} title="Nothing delivered yet" body="Finished jobs are kept here." />
            )}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {list.map((o) => (
              <JobRow key={o.id} o={o} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
