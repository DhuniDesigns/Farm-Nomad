"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { useUpdateOrganisationMutation, useUpdateProductMutation } from "@/lib/api/farmnomad";
import { PRODUCT_CATEGORIES, type Organisation, type OrganisationType, type Product } from "@/lib/types/api";
import { Field, input } from "@/components/app/ProductSheet";
import { Sheet } from "@/components/app/Sheet";
import { orgTypeLabel } from "@/components/app/give/meta";
import { Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const msg = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "Couldn't save those changes";

/** "Changes go live straight away" note shown on every admin edit form. */
export function AdminNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-app-hover p-3 text-ui-sm text-app-muted">
      <Info className="mt-0.5 size-4 shrink-0 text-app-faint" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Fix a listing for a farmer: wrong price, stock that's out of date, a best-before typo,
 * a pickup address that changed. PUT /products/{id} as ADMIN (spec §3.3).
 */
export function ListingSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [update, { isLoading }] = useUpdateProductMutation();
  const [last, setLast] = useState<Product | null>(product);
  const [f, setF] = useState({ name: "", category: "Vegetables", price: "", quantityAvailable: "", bestBeforeDate: "", pickupAddress: "", description: "" });
  useEffect(() => {
    if (!product) return;
    setLast(product);
    setF({
      name: product.name,
      category: product.category ?? "Other",
      price: product.price.toFixed(2),
      quantityAvailable: String(product.quantityAvailable),
      bestBeforeDate: product.bestBeforeDate?.slice(0, 10) ?? "",
      pickupAddress: product.pickupAddress ?? "",
      description: product.description ?? "",
    });
  }, [product]);
  const p = product ?? last;
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const price = Number(f.price);
  const qty = Number(f.quantityAvailable);
  const errors = {
    name: !f.name.trim() ? "Add a name." : undefined,
    price: !(price > 0) ? "Set a price above £0." : undefined,
    qty: f.quantityAvailable === "" || !Number.isInteger(qty) || qty < 0 ? "Enter a whole number." : undefined,
  };
  const bad = Object.values(errors).some(Boolean);

  async function save() {
    if (!p || bad) return;
    try {
      await update({
        id: p.id,
        name: f.name.trim(),
        category: f.category,
        price,
        quantityAvailable: qty,
        bestBeforeDate: f.bestBeforeDate || undefined,
        pickupAddress: f.pickupAddress.trim(),
        description: f.description.trim(),
      }).unwrap();
      toast.success(`${f.name.trim()} updated`, { description: "The change is live on the marketplace." });
      onClose();
    } catch (e) {
      toast.error(msg(e));
    }
  }

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      width={480}
      title="Edit listing"
      subtitle={p ? `${p.name} · ${p.farmerName}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={bad || isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      {p && (
        <div className="grid gap-4 px-5 py-5">
          <AdminNote>You&apos;re editing {p.farmerName}&apos;s listing. Changes go live straight away, so let them know why in Messages.</AdminNote>
          <Field label="Product name" required error={errors.name}>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} className={input(!!errors.name)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" required error={errors.price}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-faint">£</span>
                <input value={f.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" className={cn(input(!!errors.price), "num pl-6")} />
              </div>
            </Field>
            <Field label="Stock" required error={errors.qty}>
              <input value={f.quantityAvailable} onChange={(e) => set("quantityAvailable", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(input(!!errors.qty), "num")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={f.category} onChange={(e) => set("category", e.target.value)} className={input(false)}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Best before">
              <input type="date" value={f.bestBeforeDate} onChange={(e) => set("bestBeforeDate", e.target.value)} className={input(false)} />
            </Field>
          </div>
          <Field label="Pickup address" hint="Where drivers collect orders.">
            <input value={f.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} className={input(false)} />
          </Field>
          <Field label="Description">
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} className={cn(input(false), "h-auto resize-none py-2")} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

/** Fix a food group's details: a typo in the name, the wrong type, a missing charity number. */
export function OrganisationSheet({ org, onClose }: { org: Organisation | null; onClose: () => void }) {
  const [update, { isLoading }] = useUpdateOrganisationMutation();
  const [last, setLast] = useState<Organisation | null>(org);
  const [f, setF] = useState({ name: "", type: "FOODBANK" as OrganisationType, charityNumber: "", description: "" });
  useEffect(() => {
    if (!org) return;
    setLast(org);
    setF({ name: org.name, type: org.type, charityNumber: org.charityNumber ?? "", description: org.description ?? "" });
  }, [org]);
  const o = org ?? last;
  const bad = !f.name.trim();

  async function save() {
    if (!o || bad) return;
    try {
      await update({ id: o.id, name: f.name.trim(), type: f.type, charityNumber: f.charityNumber.trim() || undefined, description: f.description.trim() }).unwrap();
      toast.success(`${f.name.trim()} updated`);
      onClose();
    } catch (e) {
      toast.error(msg(e));
    }
  }

  return (
    <Sheet
      open={!!org}
      onClose={onClose}
      width={460}
      title="Edit organisation"
      subtitle={o?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={bad || isLoading}>
            Save changes
          </Button>
        </>
      }
    >
      {o && (
        <div className="grid gap-4 px-5 py-5">
          <AdminNote>Editing doesn&apos;t change whether they&apos;re verified. Approve or turn them down from the queue.</AdminNote>
          <Field label="Organisation name" required error={bad ? "Add a name." : undefined}>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input(bad)} />
          </Field>
          <Field label="Type of group">
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as OrganisationType })} className={input(false)}>
              {(Object.keys(orgTypeLabel) as OrganisationType[]).map((t) => (
                <option key={t} value={t}>
                  {orgTypeLabel[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Charity number" hint="Leave empty if they're not a registered charity.">
            <input value={f.charityNumber} onChange={(e) => setF({ ...f, charityNumber: e.target.value })} inputMode="numeric" className={cn(input(false), "num")} />
          </Field>
          <Field label="What they do">
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className={cn(input(false), "h-auto resize-none py-2")} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
