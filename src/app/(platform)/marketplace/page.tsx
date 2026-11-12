"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CaretLeft, CaretRight, MagnifyingGlass, Storefront, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { useListProductsQuery, useMeQuery } from "@/lib/api/farmnomad";
import { PRODUCT_CATEGORIES } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard, isSurplus } from "@/components/app/shop/ProductCard";
import { Button, EmptyState, Kbd, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const SORTS = [
  ["recommended", "Recommended"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["best-before", "Best before, soonest"],
  ["newest", "Newest"],
] as const;
const PRICES = [
  ["any", "Any price", 0, Infinity],
  ["u3", "Under £3", 0, 3],
  ["3-10", "£3 to £10", 3, 10],
  ["10p", "£10 and over", 10, Infinity],
] as const;
const PER_PAGE = 8;

export default function MarketplacePage() {
  const { data, isLoading } = useListProductsQuery();
  const { data: me } = useMeQuery();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [price, setPrice] = useState<(typeof PRICES)[number][0]>("any");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("recommended");
  const [surplusOnly, setSurplusOnly] = useState(false);
  const [page, setPage] = useState(1);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  useEffect(() => setPage(1), [q, cat, price, sort, surplusOnly]);

  const results = useMemo(() => {
    const [, , lo, hi] = PRICES.find((p) => p[0] === price)!;
    const term = q.trim().toLowerCase();
    const list = (data ?? [])
      .filter((p) => cat === "All" || p.category === cat)
      .filter((p) => p.price >= lo && p.price < hi)
      .filter((p) => !surplusOnly || isSurplus(p))
      .filter((p) => !term || [p.name, p.farmerName, p.category, ...(p.tags ?? [])].join(" ").toLowerCase().includes(term));
    const inStockFirst = (a: (typeof list)[number], b: (typeof list)[number]) => Number(b.quantityAvailable > 0) - Number(a.quantityAvailable > 0);
    return [...list].sort((a, b) => {
      const s = inStockFirst(a, b);
      if (s) return s;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "best-before") return (a.bestBeforeDate ?? "9").localeCompare(b.bestBeforeDate ?? "9");
      if (sort === "newest") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      return Number(isSurplus(b)) - Number(isSurplus(a));
    });
  }, [data, q, cat, price, sort, surplusOnly]);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cats = ["All", ...PRODUCT_CATEGORIES.filter((c) => data?.some((p) => p.category === c))];
  const filtered = q || cat !== "All" || price !== "any" || surplusOnly;
  const surplusCount = data?.filter(isSurplus).length ?? 0;
  const farms = new Set(data?.map((p) => p.farmerName)).size;

  return (
    <div className="mx-auto max-w-[1240px] pb-16">
      <PageHeader
        title={me ? `What's fresh, ${me.fullName.split(" ")[0]}` : "Marketplace"}
        description={data ? `${data.length} listings from ${farms} farms across the North West` : "Produce from farms near you"}
      />

      <div className="grid gap-3 px-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:px-8">
        <button
          onClick={() => setSurplusOnly((v) => !v)}
          aria-pressed={surplusOnly}
          className={cn(
            "group relative flex min-h-36 items-end overflow-hidden rounded-2xl p-5 text-left transition-[box-shadow,transform] duration-200 active:scale-[0.99]",
            "bg-[#10251B] text-white dark:bg-[#0E1A13]",
            surplusOnly && "shadow-[0_0_0_2px_var(--a-lime)]",
          )}
        >
          <Image src="/images/bag-cut.webp" alt="" width={300} height={380} className="absolute -bottom-6 right-4 h-[150%] w-auto object-contain transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1 group-hover:-rotate-3" />
          <div className="relative max-w-[60%]">
            <p className="text-ui-sm font-medium uppercase tracking-wide text-[#B9E66F]">Surplus deals · {surplusCount}</p>
            <p className="mt-1 font-display text-[22px] font-medium leading-tight tracking-[-0.02em]">Good food that missed its order, for less.</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-ui-sm text-white/70">
              {surplusOnly ? "Showing surplus only. Tap to show everything" : "Show surplus only"} <ArrowRight className="size-3.5" />
            </p>
          </div>
        </button>
        <Link href="/#group-buying" className="group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-2xl bg-[#EAF2DF] p-5 text-[#10251B] transition-transform duration-200 active:scale-[0.99] dark:bg-[#141E15] dark:text-app-text">
          <span className="absolute right-4 top-4 rounded-full bg-[#10251B] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#B9E66F]">Coming soon</span>
          <UsersThree weight="duotone" className="mb-2 size-7 text-app-accent" />
          <p className="font-display text-[20px] font-medium leading-tight tracking-[-0.02em]">Buy together. Pay less.</p>
          <p className="mt-1 text-ui-sm opacity-70">Pool with your group to buy direct from the farm at wholesale prices.</p>
        </Link>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 mt-6 border-y border-app-line bg-app-bg/90 px-4 py-2.5 backdrop-blur-xl md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-8 w-full items-center sm:w-64">
            <MagnifyingGlass className="pointer-events-none absolute left-2.5 size-4 text-app-faint" />
            <input
              ref={search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setQ(""), e.currentTarget.blur())}
              placeholder="Search produce or farms"
              aria-label="Search produce or farms"
              className="h-8 w-full rounded-[7px] bg-transparent pl-8 pr-8 outline-none shadow-[0_0_0_1px_var(--a-line)] transition-shadow placeholder:text-app-faint focus:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]"
            />
            <Kbd className="absolute right-2 hidden sm:inline-grid">/</Kbd>
          </label>
          <div role="tablist" aria-label="Category" className="-mx-1 flex max-w-full gap-0.5 overflow-x-auto px-1">
            {cats.map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={cn("relative h-8 shrink-0 rounded-[7px] px-2.5 transition-colors", cat === c ? "text-app-text" : "text-app-muted hover:text-app-text")}>
                {cat === c && <motion.span layoutId="mk-cat" className="absolute inset-0 rounded-[7px] bg-app-active" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Select label="Price" value={price} onChange={(v) => setPrice(v as typeof price)} options={PRICES.map(([v, l]) => [v, l])} />
            <Select label="Sort" value={sort} onChange={(v) => setSort(v as typeof sort)} options={SORTS.map(([v, l]) => [v, l])} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 md:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Storefront className="size-5" />}
            title="Nothing matches that"
            body="Try another search, or clear the filters to see everything that's listed."
            action={
              <Button onClick={() => (setQ(""), setCat("All"), setPrice("any"), setSurplusOnly(false))}>Clear filters</Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-ui-sm text-app-faint">
              {results.length} result{results.length === 1 ? "" : "s"}
              {filtered && (
                <button className="ml-2 text-app-muted underline-offset-2 hover:underline" onClick={() => (setQ(""), setCat("All"), setPrice("any"), setSurplusOnly(false))}>
                  Clear filters
                </button>
              )}
            </p>
            <motion.div key={`${page}-${cat}-${price}-${sort}-${surplusOnly}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {shown.map((p, i) => (
                <ProductCard key={p.id} p={p} priority={i < 4} />
              ))}
            </motion.div>
            {pages > 1 && (
              <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-1">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <CaretLeft className="size-4" />
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} aria-current={page === n ? "page" : undefined} className={cn("num size-8 rounded-[7px] transition-colors", page === n ? "bg-app-active font-medium" : "text-app-muted hover:bg-app-hover")}>
                    {n}
                  </button>
                ))}
                <Button variant="ghost" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <CaretRight className="size-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (readonly [string, string])[] }) {
  return (
    <label className="relative flex h-8 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-[7px] bg-transparent pl-2.5 pr-7 text-app-text outline-none shadow-[0_0_0_1px_var(--a-line)] transition-shadow hover:bg-app-hover focus:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <CaretRight className="pointer-events-none absolute right-2 size-3 rotate-90 text-app-faint" />
    </label>
  );
}
