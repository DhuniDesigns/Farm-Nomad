"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import { useCreateDonationMutation, useCreateSurplusMutation, useListMyProductsQuery } from "@/lib/api/farmnomad";
import { daysUntil, stockState } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { useApp } from "./AppState";
import { Field, input } from "./ProductSheet";
import { Sheet } from "./Sheet";
import { Button, Pill } from "./ui";

/**
 * Give stock away. Two modes share one form: pick one of your products (never a raw ID, spec 1.9),
 * then how much.
 * - surplus: flag stock for food groups to claim (POST /surplus, to confirm with backend)
 * - donate: donate it outright (POST /donations {productId, quantity}, spec §3.9)
 */
export function SurplusSheet({ mode = "surplus" }: { mode?: "surplus" | "donate" }) {
  const app = useApp();
  const donate = mode === "donate";
  const open = donate ? !!app.donateSheet : app.surplusSheet;
  const preset = donate ? app.donateSheet?.productId : undefined;
  const { data: products = [] } = useListMyProductsQuery();
  const [createSurplus, s1] = useCreateSurplusMutation();
  const [createDonation, s2] = useCreateDonationMutation();
  const isLoading = s1.isLoading || s2.isLoading;
  const [pid, setPid] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // Soonest best-before first: those are the ones worth flagging.
  const sorted = useMemo(
    () => products.filter((p) => p.quantityAvailable > 0).sort((a, b) => (a.bestBeforeDate ?? "9").localeCompare(b.bestBeforeDate ?? "9")),
    [products],
  );
  const chosen = sorted.find((p) => p.id === pid);

  useEffect(() => {
    if (open) {
      setPid(preset ?? sorted[0]?.id ?? null);
      setQty(1);
      setNote("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const max = chosen?.quantityAvailable ?? 1;
  const close = () => (donate ? app.setDonateSheet(null) : app.setSurplusSheet(false));

  async function submit() {
    if (!chosen) return;
    try {
      if (donate) {
        await createDonation({ productId: chosen.id, quantity: qty, note: note.trim() || undefined }).unwrap();
        toast.success("Donation listed", { description: `Verified food groups nearby can now claim ${qty} × ${chosen.name}.` });
      } else {
        await createSurplus({ productId: chosen.id, quantity: qty }).unwrap();
        toast.success("Surplus flagged", { description: `Food groups nearby can now claim ${qty} × ${chosen.name}.` });
      }
      close();
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "That didn't go through", { description: "Try again in a moment." });
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={donate ? "Donate produce" : "Flag surplus"}
      subtitle={donate ? "Free to verified food banks, schools and community groups nearby. It comes off your stock." : "Verified food groups nearby are told straight away."}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!chosen || isLoading}>
            {donate ? "Donate" : "Flag"} {qty} {qty === 1 ? "unit" : "units"}
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
        {donate && (
          <Field label="Note for food groups" hint="Optional. Condition, collection times, anything useful.">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={240} placeholder="e.g. A little wilted, fine for cooking. Collect before 4pm." className={cn(input(false), "h-auto resize-none py-2")} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}
