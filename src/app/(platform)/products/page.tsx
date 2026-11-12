"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, MagnifyingGlass, Package, Plus } from "@phosphor-icons/react/dist/ssr";
import { useListMyProductsQuery } from "@/lib/api/farmnomad";
import { daysUntil, stockState, type Product, type StockState } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, EmptyState, Kbd, Pill, Skeleton, gbp, type Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const FILTERS: { id: "all" | StockState; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "low", label: "Low stock" },
  { id: "expiring", label: "Expiring" },
  { id: "expired", label: "Expired" },
  { id: "out", label: "Out of stock" },
];

const stateMeta: Record<StockState, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "green" },
  low: { label: "Low stock", tone: "amber" },
  expiring: { label: "Expiring", tone: "amber" },
  expired: { label: "Expired", tone: "red" },
  out: { label: "Out of stock", tone: "neutral" },
};

type SortKey = "name" | "price" | "quantityAvailable" | "bestBeforeDate";

export default function ProductsPage() {
  const { data, isLoading } = useListMyProductsQuery();
  const { setProductSheet } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "bestBeforeDate", dir: 1 });
  const search = useRef<HTMLInputElement>(null);

  // "/" focuses search, like Linear and GitHub.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const withState = useMemo(() => (data ?? []).map((p) => ({ p, s: stockState(p) })), [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: withState.length };
    withState.forEach(({ s }) => (c[s] = (c[s] ?? 0) + 1));
    return c;
  }, [withState]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return withState
      .filter(({ s }) => filter === "all" || s === filter)
      .filter(({ p }) => !term || [p.name, p.category, ...(p.tags ?? [])].join(" ").toLowerCase().includes(term))
      .sort((a, b) => {
        const av = a.p[sort.key] ?? "";
        const bv = b.p[sort.key] ?? "";
        return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
      });
  }, [withState, filter, q, sort]);

  const maxStock = Math.max(80, ...(data ?? []).map((p) => p.quantityAvailable));
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="pb-16">
      <PageHeader
        title="Products"
        description="Everything you have listed, soonest best-before first."
        actions={
          <Button variant="primary" onClick={() => setProductSheet({ mode: "new" })} kbd="C">
            <Plus weight="bold" className="size-3.5" /> New product
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-y border-app-line px-4 py-2.5 md:px-8">
        <div role="tablist" aria-label="Filter" className="-mx-1 flex max-w-full gap-0.5 overflow-x-auto px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("relative flex h-7 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 transition-colors", filter === f.id ? "text-app-text" : "text-app-muted hover:text-app-text")}
            >
              {filter === f.id && <motion.span layoutId="prod-filter" className="absolute inset-0 rounded-[7px] bg-app-active" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />}
              <span className="relative">{f.label}</span>
              {!!counts[f.id] && <span className="num relative text-ui-sm text-app-faint">{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <label className="relative ml-auto flex h-8 w-full items-center sm:w-64">
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 size-4 text-app-faint" />
          <input
            ref={search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setQ(""), e.currentTarget.blur())}
            placeholder="Filter products"
            aria-label="Filter products"
            className="h-8 w-full rounded-[7px] bg-transparent pl-8 pr-8 outline-none shadow-[0_0_0_1px_var(--a-line)] transition-shadow placeholder:text-app-faint focus:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]"
          />
          <Kbd className="absolute right-2">/</Kbd>
        </label>
      </div>

      {isLoading ? (
        <div className="grid gap-2 px-4 py-4 md:px-8">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title={data?.length ? "No products match" : "No products yet"}
          body={data?.length ? "Try a different filter or clear the search." : "List what you've got ready and buyers nearby will see it straight away."}
          action={
            data?.length ? (
              <Button onClick={() => (setQ(""), setFilter("all"))}>Clear filters</Button>
            ) : (
              <Button variant="primary" onClick={() => setProductSheet({ mode: "new" })}>
                <Plus weight="bold" className="size-3.5" /> New product
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-app-bg/90 backdrop-blur">
                <tr className="border-b border-app-line text-left text-ui-sm text-app-faint">
                  <Th className="pl-8" onSort={() => toggleSort("name")} sort={sort.key === "name" ? sort.dir : 0}>Product</Th>
                  <Th>Category</Th>
                  <Th align="right" onSort={() => toggleSort("price")} sort={sort.key === "price" ? sort.dir : 0}>Price</Th>
                  <Th onSort={() => toggleSort("quantityAvailable")} sort={sort.key === "quantityAvailable" ? sort.dir : 0}>In stock</Th>
                  <Th onSort={() => toggleSort("bestBeforeDate")} sort={sort.key === "bestBeforeDate" ? sort.dir : 0}>Best before</Th>
                  <Th className="pr-8">Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, s }, i) => (
                  <motion.tr
                    key={p.id}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                    onClick={() => setProductSheet({ mode: "edit", product: p })}
                    onKeyDown={(e) => e.key === "Enter" && setProductSheet({ mode: "edit", product: p })}
                    tabIndex={0}
                    className="cursor-default border-b border-app-line transition-colors hover:bg-app-hover focus-visible:bg-app-hover focus-visible:outline-none"
                  >
                    <td className="py-2 pl-8 pr-3">
                      <div className="flex items-center gap-3">
                        <Thumb p={p} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          {!!p.tags?.length && <p className="truncate text-ui-sm text-app-faint">{p.tags.join(" · ")}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 text-app-muted">{p.category ?? "Other"}</td>
                    <td className="num px-3 text-right">{gbp(p.price)}</td>
                    <td className="px-3">
                      <StockBar value={p.quantityAvailable} max={maxStock} state={s} />
                    </td>
                    <td className="px-3">
                      <BestBefore iso={p.bestBeforeDate} />
                    </td>
                    <td className="pr-8">
                      <Pill tone={stateMeta[s].tone}>{stateMeta[s].label}</Pill>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <p className="px-8 pt-3 text-ui-sm text-app-faint">
              {rows.length} of {data?.length} products · Click a row or press <Kbd>↵</Kbd> to edit
            </p>
          </div>

          {/* Phone: list */}
          <ul className="md:hidden">
            {rows.map(({ p, s }) => (
              <li key={p.id} className="border-b border-app-line">
                <button onClick={() => setProductSheet({ mode: "edit", product: p })} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-app-hover">
                  <Thumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="num text-ui-sm text-app-faint">
                      {gbp(p.price)} · {p.quantityAvailable} in stock
                    </p>
                  </div>
                  <Pill tone={stateMeta[s].tone}>{stateMeta[s].label}</Pill>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Th({ children, className, align, onSort, sort = 0 }: { children: React.ReactNode; className?: string; align?: "right"; onSort?: () => void; sort?: 0 | 1 | -1 }) {
  const Icon = sort === -1 ? ArrowDown : ArrowUp;
  return (
    <th className={cn("h-9 px-3 font-medium", align === "right" && "text-right", className)} aria-sort={sort === 1 ? "ascending" : sort === -1 ? "descending" : undefined}>
      {onSort ? (
        <button onClick={onSort} className={cn("inline-flex items-center gap-1 transition-colors hover:text-app-text", sort && "text-app-text")}>
          {children}
          <Icon className={cn("size-3", !sort && "opacity-0")} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function Thumb({ p }: { p: Product }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-app-hover">
      {p.coverImageUrl ? (
        <Image src={p.coverImageUrl} alt="" width={64} height={64} unoptimized={p.coverImageUrl.startsWith("blob:")} className="size-8 object-contain" />
      ) : (
        <Package className="size-4 text-app-faint" />
      )}
    </span>
  );
}

function StockBar({ value, max, state }: { value: number; max: number; state: StockState }) {
  const color = state === "low" ? "bg-app-amber" : state === "out" ? "bg-app-faint" : "bg-app-accent";
  return (
    <div className="flex items-center gap-2.5">
      <span className="num w-8 text-right">{value}</span>
      <span className="h-1 w-20 overflow-hidden rounded-full bg-app-hover">
        <span className={cn("block h-full rounded-full", color)} style={{ width: `${Math.max(value ? 4 : 0, (value / max) * 100)}%` }} />
      </span>
    </div>
  );
}

function BestBefore({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-app-faint">None</span>;
  const d = daysUntil(iso);
  const date = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <span className="num">
      {date}{" "}
      <span className={cn("text-ui-sm", d < 0 ? "text-app-red" : d <= 3 ? "text-app-amber" : "text-app-faint")}>
        {d < 0 ? `${-d}d ago` : d === 0 ? "today" : `in ${d}d`}
      </span>
    </span>
  );
}
