"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import { useCreateSurplusMutation, useListMyProductsQuery } from "@/lib/api/farmnomad";
import { daysUntil, stockState } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { useApp } from "./AppState";
import { Field, input } from "./ProductSheet";
import { Sheet } from "./Sheet";
import { Button, Pill } from "./ui";

/** Flag surplus: pick one of your products (never a raw ID, per spec 1.9), then how much. */
export function SurplusSheet() {
  const { surplusSheet, setSurplusSheet } = useApp();
  const { data: products = [] } = useListMyProductsQuery();
  const [create, { isLoading }] = useCreateSurplusMutation();
  const [pid, setPid] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  // Soonest best-before first: those are the ones worth flagging.
  const sorted = useMemo(
    () => products.filter((p) => p.quantityAvailable > 0).sort((a, b) => (a.bestBeforeDate ?? "9").localeCompare(b.bestBeforeDate ?? "9")),
    [products],
  );
  const chosen = sorted.find((p) => p.id === pid);

  useEffect(() => {
    if (surplusSheet) {
      setPid(sorted[0]?.id ?? null);
      setQty(1);
    }
  }, [surplusSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  const max = chosen?.quantityAvailable ?? 1;
  const close = () => setSurplusSheet(false);

  async function submit() {
    if (!chosen) return;
    try {
      await create({ productId: chosen.id, quantity: qty }).unwrap();
      toast.success("Surplus flagged", { description: `Food groups nearby can now claim ${qty} × ${chosen.name}.` });
      close();
    } catch {
      toast.error("That didn't go through", { description: "Try again in a moment." });
    }
  }

  return (
    <Sheet
      open={surplusSheet}
      onClose={close}
      title="Flag surplus"
      subtitle="Verified food groups nearby are told straight away."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!chosen || isLoading}>
            Flag {qty} {qty === 1 ? "unit" : "units"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 px-5 py-5">
        <div className="grid gap-1.5">
          <p className="font-medium">Product</p>
          <div role="radiogroup" aria-label="Product" className="grid gap-1 rounded-[9px] p-1 shadow-[0_0_0_1px_var(--a-line-strong)]">
            {sorted.map((p) => {
              const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
              const s = stockState(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={pid === p.id}
                  onClick={() => {
                    setPid(p.id);
                    setQty(1);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-[7px] px-2 py-1.5 text-left transition-colors",
                    pid === p.id ? "bg-app-active" : "hover:bg-app-hover",
                  )}
                >
                  <span className={cn("grid size-4 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]", pid === p.id && "shadow-[inset_0_0_0_5px_var(--a-accent)]")} />
                  <span className="grid size-8 place-items-center rounded-md bg-app-hover">
                    {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={48} height={48} className="size-7 object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="num text-ui-sm text-app-faint">{p.quantityAvailable} in stock</span>
                  </span>
                  {d !== null && (s === "expiring" || s === "expired") ? (
                    <Pill tone={s === "expired" ? "red" : "amber"}>{d < 0 ? "Past date" : d === 0 ? "Today" : `${d}d left`}</Pill>
                  ) : d !== null ? (
                    <span className="num text-ui-sm text-app-faint">{d}d left</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Quantity" hint={chosen ? `Up to ${max} available` : undefined}>
          <div className="flex items-center gap-2">
            <Button type="button" aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 px-0">
              <Minus className="size-4" />
            </Button>
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(Math.min(max, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
              className={cn(input(false), "num w-24 text-center")}
              aria-label="Quantity"
            />
            <Button type="button" aria-label="More" onClick={() => setQty((q) => Math.min(max, q + 1))} className="w-9 px-0">
              <Plus className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setQty(max)} className="ml-1">
              All {max}
            </Button>
          </div>
        </Field>
      </div>
    </Sheet>
  );
}
