"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateMealMutation, useListProductsQuery, useUpdateMealMutation } from "@/lib/api/farmnomad";
import type { Meal } from "@/lib/types/api";
import { Field, PhotosPicker, input } from "@/components/app/ProductSheet";
import { Sheet } from "@/components/app/Sheet";
import { Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { CUISINES, DIETARY } from "./meta";

const EMPTY = { name: "", description: "", price: "", portionsAvailable: "", cuisine: "British", photos: [] as string[], available: true, dietary: [] as string[], farms: [] as string[] };

/**
 * Add or edit a meal (spec §3.4 POST/PUT /meals). Photos are imageUrls[] (already-hosted URLs, not
 * uploads: spec §10 Q3 asks where they're hosted). `open`: null closed, "new", or the meal to edit.
 */
export function MealSheet({ open, onClose }: { open: Meal | "new" | null; onClose: () => void }) {
  const editing = open && open !== "new" ? open : null;
  const [create, c] = useCreateMealMutation();
  const [update, u] = useUpdateMealMutation();
  const { data: products } = useListProductsQuery();
  const farms = useMemo(() => [...new Set(products?.map((p) => p.farmerName).filter(Boolean) as string[])].sort(), [products]);
  const [f, setF] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setF(
      editing
        ? { name: editing.name, description: editing.description, price: String(editing.price), portionsAvailable: String(editing.portionsAvailable), cuisine: editing.cuisine, photos: editing.imageUrls ?? [], available: editing.available, dietary: editing.dietary ?? [], farms: editing.farms ?? [] }
        : EMPTY,
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const price = Number(f.price);
  const portions = Number(f.portionsAvailable);
  const errors = {
    name: !f.name.trim() ? "Give the meal a name." : undefined,
    price: !(price > 0) ? "Set a price above £0." : undefined,
    portionsAvailable: f.portionsAvailable === "" || !Number.isInteger(portions) || portions < 0 ? "Enter a whole number." : undefined,
  };
  const bad = Object.values(errors).some(Boolean);
  const toggle = (k: "dietary" | "farms", v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  async function save() {
    setTried(true);
    if (bad) return;
    const body = { name: f.name.trim(), description: f.description.trim(), price, portionsAvailable: portions, cuisine: f.cuisine, imageUrls: f.photos, available: f.available && portions > 0, dietary: f.dietary, farms: f.farms };
    try {
      if (editing) await update({ id: editing.id, ...body }).unwrap();
      else await create(body).unwrap();
      toast.success(editing ? "Meal updated" : "Meal added to your menu", { description: body.available ? "Diners can order it on NomadEat now." : "It's hidden until you switch it on." });
      onClose();
    } catch (e) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "Couldn't save the meal");
    }
  }

  const chip = (on: boolean) =>
    cn("h-8 rounded-full px-3 text-ui-sm font-medium transition-[background-color,box-shadow,color] active:scale-[0.97]", on ? "bg-app-accent-soft text-app-accent shadow-[inset_0_0_0_1px_var(--a-accent)]" : "text-app-muted shadow-[inset_0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover");

  return (
    <Sheet
      open={!!open}
      onClose={onClose}
      width={520}
      title={editing ? "Edit meal" : "Add a meal"}
      subtitle={editing ? editing.name : "Shown on NomadEat to diners near your kitchen."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={c.isLoading || u.isLoading}>
            {editing ? "Save changes" : "Add to menu"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 px-5 py-5">
        <PhotosPicker value={f.photos} onChange={(v) => set("photos", v)} />
        <Field label="Meal name" required error={tried ? errors.name : undefined}>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className={input(tried && !!errors.name)} placeholder="e.g. Lancashire hotpot" />
        </Field>
        <Field label="Description" hint="What's in it and how big a portion is.">
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={280} className={cn(input(false), "h-auto resize-none py-2")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per portion" required error={tried ? errors.price : undefined}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-faint">£</span>
              <input value={f.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" className={cn(input(tried && !!errors.price), "num pl-6")} placeholder="7.50" />
            </div>
          </Field>
          <Field label="Portions available" required error={tried ? errors.portionsAvailable : undefined}>
            <input value={f.portionsAvailable} onChange={(e) => set("portionsAvailable", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(input(tried && !!errors.portionsAvailable), "num")} placeholder="12" />
          </Field>
        </div>
        <div className="grid gap-2" role="radiogroup" aria-label="Cuisine">
          <p className="font-medium">Cuisine</p>
          <div className="flex flex-wrap gap-1.5">
            {CUISINES.map((x) => (
              <button key={x} type="button" role="radio" aria-checked={f.cuisine === x} onClick={() => set("cuisine", x)} className={chip(f.cuisine === x)}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2" role="group" aria-label="Dietary">
          <p className="font-medium">Dietary</p>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY.map((x) => (
              <button key={x} type="button" aria-pressed={f.dietary.includes(x)} onClick={() => toggle("dietary", x)} className={chip(f.dietary.includes(x))}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2" role="group" aria-label="Made with produce from">
          <p className="font-medium">Made with produce from</p>
          <p className="-mt-1 text-ui-sm text-app-faint">Diners see which FarmNomad farms your ingredients came from.</p>
          <div className="flex flex-wrap gap-1.5">
            {farms.map((x) => (
              <button key={x} type="button" aria-pressed={f.farms.includes(x)} onClick={() => toggle("farms", x)} className={chip(f.farms.includes(x))}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3.5 shadow-[0_0_0_1px_var(--a-line)]">
          <span>
            <span className="block font-medium">On the menu</span>
            <span className="block text-ui-sm text-app-faint">{portions === 0 && f.portionsAvailable !== "" ? "Add portions to switch it on." : "Turn off to hide it from diners."}</span>
          </span>
          <Switch on={f.available && portions !== 0} onChange={(v) => set("available", v)} label="On the menu" />
        </label>
      </div>
    </Sheet>
  );
}

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onChange(!on);
      }}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40", on ? "bg-app-accent" : "bg-app-line-strong")}
    >
      <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]", on && "translate-x-4")} />
    </button>
  );
}
