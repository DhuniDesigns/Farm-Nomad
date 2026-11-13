"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowSquareOut, Package, Trash } from "@phosphor-icons/react/dist/ssr";
import {
  useDeleteProductMutation,
  useListProductsQuery,
  useRestoreProductMutation,
} from "@/lib/api/farmnomad";
import { daysUntil, type Product } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Confirm,
  Filters,
  Search,
  Table,
  td,
  tr,
} from "@/components/app/admin/parts";
import { EmptyState, IconButton, Pill, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type F = "all" | "surplus" | "low" | "past" | "out";
const isSurplus = (p: Product) =>
  p.tags?.some((t) => /surplus/i.test(t)) || /surplus/i.test(p.name);
const match: Record<F, (p: Product) => boolean> = {
  all: () => true,
  surplus: isSurplus,
  low: (p) => p.quantityAvailable > 0 && p.quantityAvailable <= 5,
  past: (p) => !!p.bestBeforeDate && daysUntil(p.bestBeforeDate) < 0,
  out: (p) => p.quantityAvailable === 0,
};

/** Admin listings (spec §3.3 GET /products, DELETE /products/{id} as ADMIN): moderate what's for sale. */
export default function AdminListings() {
  const { data, isLoading } = useListProductsQuery();
  const [del, { isLoading: busy }] = useDeleteProductMutation();
  const [restore] = useRestoreProductMutation();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [removing, setRemoving] = useState<Product | null>(null);
  useEffect(() => {
    const x = new URLSearchParams(window.location.search).get("f") as F | null;
    if (x && x in match) setF(x);
  }, []);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          match[f](p) &&
          `${p.name} ${p.farmerName ?? ""} ${p.category ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [data, f, q],
  );
  const farms = new Set(data?.map((p) => p.farmerName)).size;

  async function remove() {
    if (!removing) return;
    const p = removing;
    try {
      await del(p.id).unwrap();
      setRemoving(null);
      toast(`Took down ${p.name}`, {
        action: { label: "Undo", onClick: () => restore(p) },
      });
    } catch {
      toast.error("Couldn't take that listing down");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader
        title="Listings"
        description={
          data
            ? `${data.length} products from ${farms} farms on the marketplace.`
            : "Everything for sale on the marketplace."
        }
      />
      <div className="grid gap-3 px-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Filters
            id="listings"
            value={f}
            onChange={setF}
            options={(
              [
                ["all", "All"],
                ["surplus", "Surplus deals"],
                ["low", "Low stock"],
                ["past", "Past best-before"],
                ["out", "Sold out"],
              ] as [F, string][]
            ).map(([id, label]) => ({
              id,
              label,
              n: data?.filter(match[id]).length,
            }))}
          />
          <Search
            value={q}
            onChange={setQ}
            placeholder="Search product or farm"
          />
        </div>
        <Table
          head={["Product", "Farm", "Price", "Stock", "Best before", ""]}
          minWidth={820}
          loading={isLoading}
          empty={
            !rows.length && !isLoading ? (
              <EmptyState
                icon={<Package className="size-5" />}
                title="Nothing here"
                body="No listings match this filter."
              />
            ) : undefined
          }
        >
          {rows.map((p) => {
            const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
            return (
              <tr key={p.id} className={tr}>
                <td className={td}>
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F1F4EC] dark:bg-[#121912]">
                      {p.coverImageUrl && (
                        <Image
                          src={p.coverImageUrl}
                          alt=""
                          width={80}
                          height={80}
                          className="size-8 object-contain"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {isSurplus(p) && <Pill tone="green">Surplus</Pill>}
                      </span>
                      <span className="block text-ui-sm text-app-faint">
                        {p.category}
                      </span>
                    </span>
                  </span>
                </td>
                <td className={td + " text-app-muted"}>{p.farmerName}</td>
                <td className={td + " num"}>{gbp(p.price)}</td>
                <td
                  className={cn(
                    td,
                    "num",
                    p.quantityAvailable === 0
                      ? "text-app-red"
                      : p.quantityAvailable <= 5
                        ? "text-app-amber"
                        : "text-app-muted",
                  )}
                >
                  {p.quantityAvailable === 0 ? "Sold out" : p.quantityAvailable}
                </td>
                <td
                  className={cn(
                    td,
                    "text-ui-sm",
                    d !== null && d < 0
                      ? "text-app-red"
                      : d !== null && d <= 2
                        ? "text-app-amber"
                        : "text-app-muted",
                  )}
                >
                  {d === null
                    ? "–"
                    : d < 0
                      ? `${-d}d ago`
                      : d === 0
                        ? "Today"
                        : `In ${d}d`}
                </td>
                <td className={td + " text-right"}>
                  <span className="inline-flex items-center gap-0.5">
                    <Link
                      href={`/marketplace/${p.id}`}
                      aria-label={`View ${p.name}`}
                      className="inline-grid size-8 place-items-center rounded-[7px] text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                    >
                      <ArrowSquareOut className="size-4" />
                    </Link>
                    <IconButton
                      label={`Take down ${p.name}`}
                      onClick={() => setRemoving(p)}
                    >
                      <Trash className="size-4" />
                    </IconButton>
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
      <Confirm
        open={!!removing}
        title={`Take down ${removing?.name}?`}
        body={`It comes off the marketplace straight away. ${removing?.farmerName} keeps their orders so far.`}
        action="Take down"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
