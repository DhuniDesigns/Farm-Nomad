"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowSquareOut, ForkKnife, Package, PencilSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import { useAllMealsAdminQuery, useCreateMealMutation, useDeleteMealMutation, useDeleteProductMutation, useListProductsQuery, useRestoreProductMutation, useUpdateMealMutation } from "@/lib/api/farmnomad";
import { daysUntil, type Meal, type Product } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { ListingSheet } from "@/components/app/admin/EditSheets";
import { Confirm, Filters, Search, Table, td, tr } from "@/components/app/admin/parts";
import { MealSheet, Switch } from "@/components/app/meals/MealSheet";
import { MealArt } from "@/components/app/meals/meta";
import { EmptyState, IconButton, Pill, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type Tab = "produce" | "meals";
type F = "all" | "surplus" | "low" | "past" | "out";
const isSurplus = (p: Product) => p.tags?.some((t) => /surplus/i.test(t)) || /surplus/i.test(p.name);
const match: Record<F, (p: Product) => boolean> = {
  all: () => true,
  surplus: isSurplus,
  low: (p) => p.quantityAvailable > 0 && p.quantityAvailable <= 5,
  past: (p) => !!p.bestBeforeDate && daysUntil(p.bestBeforeDate) < 0,
  out: (p) => p.quantityAvailable === 0,
};

/**
 * Admin listings: everything for sale. Fix a listing for a farmer or kitchen (PUT /products/{id},
 * PUT /meals/{id} as ADMIN), hide it, or take it down (DELETE as ADMIN).
 */
export default function AdminListings() {
  const [tab, setTab] = useState<Tab>("produce");
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const x = sp.get("f") as F | null;
    if (x && x in match) setF(x);
    if (sp.get("tab") === "meals") setTab("meals");
    if (sp.get("q")) setQ(sp.get("q")!);
  }, []);

  const { data: products } = useListProductsQuery();
  const { data: meals } = useAllMealsAdminQuery();

  const select = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "meals" ? "/admin/listings?tab=meals" : "/admin/listings");
  };

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Listings" description="Everything for sale on FarmNomad. Fix a listing when a farm or kitchen gets something wrong." />
      <div className="grid gap-3 px-4 md:px-8">
        <div role="tablist" aria-label="Listings" className="flex gap-1 border-b border-app-line">
          {(
            [
              ["produce", "Produce", products?.length, Package],
              ["meals", "Meals", meals?.length, ForkKnife],
            ] as const
          ).map(([t, label, n, Icon]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => select(t)} className={cn("relative -mb-px flex h-10 items-center gap-1.5 px-3 font-medium transition-colors", tab === t ? "text-app-text" : "text-app-faint hover:text-app-muted")}>
              <Icon className="size-4" /> {label}
              {n !== undefined && <span className="num rounded-full bg-app-hover px-1.5 text-ui-sm text-app-muted">{n}</span>}
              {tab === t && <motion.span layoutId="listing-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-app-text" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />}
            </button>
          ))}
        </div>
        {tab === "produce" ? <Produce q={q} setQ={setQ} f={f} setF={setF} /> : <Meals q={q} setQ={setQ} />}
      </div>
    </div>
  );
}

function Produce({ q, setQ, f, setF }: { q: string; setQ: (v: string) => void; f: F; setF: (v: F) => void }) {
  const { data, isLoading } = useListProductsQuery();
  const [del, { isLoading: busy }] = useDeleteProductMutation();
  const [restore] = useRestoreProductMutation();
  const [removing, setRemoving] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const rows = useMemo(() => (data ?? []).filter((p) => match[f](p) && `${p.name} ${p.farmerName ?? ""} ${p.category ?? ""}`.toLowerCase().includes(q.toLowerCase())), [data, f, q]);

  async function remove() {
    if (!removing) return;
    const p = removing;
    try {
      await del(p.id).unwrap();
      setRemoving(null);
      toast(`Took down ${p.name}`, { action: { label: "Undo", onClick: () => restore(p) } });
    } catch {
      toast.error("Couldn't take that listing down");
    }
  }

  return (
    <>
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
          ).map(([id, label]) => ({ id, label, n: data?.filter(match[id]).length }))}
        />
        <Search value={q} onChange={setQ} placeholder="Search product or farm" />
      </div>
      <Table head={["Product", "Farm", "Price", "Stock", "Best before", ""]} minWidth={860} loading={isLoading} empty={!rows.length && !isLoading ? <EmptyState icon={<Package className="size-5" />} title="Nothing here" body="No listings match this filter." /> : undefined}>
        {rows.map((p) => {
          const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
          return (
            <tr key={p.id} className={tr}>
              <td className={td}>
                <button onClick={() => setEditing(p)} className="flex items-center gap-3 text-left">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F1F4EC] dark:bg-[#121912]">{p.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={80} height={80} className="size-8 object-contain" />}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{p.name}</span>
                      {isSurplus(p) && <Pill tone="green">Surplus</Pill>}
                    </span>
                    <span className="block text-ui-sm text-app-faint">{p.category}</span>
                  </span>
                </button>
              </td>
              <td className={td + " text-app-muted"}>{p.farmerName}</td>
              <td className={td + " num"}>{gbp(p.price)}</td>
              <td className={cn(td, "num", p.quantityAvailable === 0 ? "text-app-red" : p.quantityAvailable <= 5 ? "text-app-amber" : "text-app-muted")}>{p.quantityAvailable === 0 ? "Sold out" : p.quantityAvailable}</td>
              <td className={cn(td, "text-ui-sm", d !== null && d < 0 ? "text-app-red" : d !== null && d <= 2 ? "text-app-amber" : "text-app-muted")}>{d === null ? "–" : d < 0 ? `${-d}d ago` : d === 0 ? "Today" : `In ${d}d`}</td>
              <td className={td + " text-right"}>
                <span className="inline-flex items-center gap-0.5">
                  <IconButton label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                    <PencilSimple className="size-4" />
                  </IconButton>
                  <Link href={`/marketplace/${p.id}`} aria-label={`View ${p.name}`} title="View on the marketplace" className="inline-grid size-8 place-items-center rounded-[7px] text-app-muted transition-colors hover:bg-app-hover hover:text-app-text">
                    <ArrowSquareOut className="size-4" />
                  </Link>
                  <IconButton label={`Take down ${p.name}`} onClick={() => setRemoving(p)}>
                    <Trash className="size-4" />
                  </IconButton>
                </span>
              </td>
            </tr>
          );
        })}
      </Table>
      <ListingSheet product={editing ? (data?.find((x) => x.id === editing.id) ?? editing) : null} onClose={() => setEditing(null)} />
      <Confirm open={!!removing} title={`Take down ${removing?.name}?`} body={`It comes off the marketplace straight away. ${removing?.farmerName} keeps their orders so far.`} action="Take down" danger busy={busy} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}

function Meals({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const { data, isLoading } = useAllMealsAdminQuery();
  const [update] = useUpdateMealMutation();
  const [del, { isLoading: busy }] = useDeleteMealMutation();
  const [create] = useCreateMealMutation();
  const [editing, setEditing] = useState<Meal | null>(null);
  const [removing, setRemoving] = useState<Meal | null>(null);
  const rows = (data ?? []).filter((m) => `${m.name} ${m.kitchenName ?? ""} ${m.cuisine}`.toLowerCase().includes(q.toLowerCase()));

  async function remove() {
    if (!removing) return;
    const m = removing;
    try {
      await del(m.id).unwrap();
      setRemoving(null);
      toast(`Took down ${m.name}`, {
        // The demo puts it back under the demo kitchen; a real undo would restore it for its own kitchen.
        action: { label: "Undo", onClick: () => create({ name: m.name, description: m.description, price: m.price, portionsAvailable: m.portionsAvailable, cuisine: m.cuisine, imageUrls: m.imageUrls, available: m.available, dietary: m.dietary, farms: m.farms }) },
      });
    } catch {
      toast.error("Couldn't take that meal down");
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Search value={q} onChange={setQ} placeholder="Search meal, kitchen or cuisine" />
      </div>
      <Table head={["Meal", "Kitchen", "Price", "Portions", "On NomadEat", ""]} minWidth={820} loading={isLoading} empty={!rows.length && !isLoading ? <EmptyState icon={<ForkKnife className="size-5" />} title="No meals match" body="Try another search." /> : undefined}>
        {rows.map((m) => (
          <tr key={m.id} className={tr}>
            <td className={td}>
              <button onClick={() => setEditing(m)} className="flex items-center gap-3 text-left">
                <MealArt meal={m} className={cn("size-10 shrink-0 rounded-lg", !m.available && "opacity-50 grayscale")} sizes="40px" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="block text-ui-sm text-app-faint">{m.cuisine}</span>
                </span>
              </button>
            </td>
            <td className={td + " text-app-muted"}>{m.kitchenName}</td>
            <td className={td + " num"}>{gbp(m.price)}</td>
            <td className={cn(td, "num", m.portionsAvailable === 0 ? "text-app-red" : m.portionsAvailable <= 3 ? "text-app-amber" : "text-app-muted")}>{m.portionsAvailable === 0 ? "Sold out" : m.portionsAvailable}</td>
            <td className={td}>
              <Switch
                on={m.available}
                label={`${m.name} on NomadEat`}
                disabled={m.portionsAvailable === 0 && !m.available}
                onChange={(v) => {
                  update({ id: m.id, available: v });
                  toast(v ? `${m.name} is back on NomadEat` : `${m.name} is hidden from diners`);
                }}
              />
            </td>
            <td className={td + " text-right"}>
              <span className="inline-flex items-center gap-0.5">
                <IconButton label={`Edit ${m.name}`} onClick={() => setEditing(m)}>
                  <PencilSimple className="size-4" />
                </IconButton>
                <Link href={`/nomadeat/${m.id}`} aria-label={`View ${m.name}`} title="View on NomadEat" className="inline-grid size-8 place-items-center rounded-[7px] text-app-muted transition-colors hover:bg-app-hover hover:text-app-text">
                  <ArrowSquareOut className="size-4" />
                </Link>
                <IconButton label={`Take down ${m.name}`} onClick={() => setRemoving(m)}>
                  <Trash className="size-4" />
                </IconButton>
              </span>
            </td>
          </tr>
        ))}
      </Table>
      <MealSheet open={editing ? (data?.find((x) => x.id === editing.id) ?? editing) : null} onClose={() => setEditing(null)} />
      <Confirm open={!!removing} title={`Take down ${removing?.name}?`} body={`It comes off NomadEat straight away. To hide it for now instead, switch it off.`} action="Take down" danger busy={busy} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
