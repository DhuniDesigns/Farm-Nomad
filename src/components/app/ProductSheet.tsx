"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ImageSquare, Trash, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useCreateProductMutation, useDeleteProductMutation, useRestoreProductMutation, useUpdateProductMutation } from "@/lib/api/farmnomad";
import { PRODUCT_CATEGORIES, daysUntil, type ProductInput } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { useApp } from "./AppState";
import { Sheet } from "./Sheet";
import { Button, Kbd } from "./ui";

const empty = { name: "", description: "", price: "", quantityAvailable: "", category: "Vegetables", bestBeforeDate: "", pickupAddress: "Hollins Farm, Moss Lane, Garstang PR3 1ZA", tags: [] as string[], photos: [] as string[] };
type Form = typeof empty;
type Errors = Partial<Record<keyof Form, string>>;

export function ProductSheet() {
  const { productSheet, setProductSheet } = useApp();
  const open = !!productSheet;
  const editing = productSheet?.mode === "edit" ? productSheet.product : null;

  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: updating }] = useUpdateProductMutation();
  const [del] = useDeleteProductMutation();
  const [restore] = useRestoreProductMutation();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? "",
            price: String(editing.price),
            quantityAvailable: String(editing.quantityAvailable),
            category: editing.category ?? "Other",
            bestBeforeDate: editing.bestBeforeDate ?? "",
            pickupAddress: editing.pickupAddress ?? "",
            tags: editing.tags ?? [],
            photos: [editing.coverImageUrl, ...(editing.imageUrls ?? [])].filter(Boolean) as string[],
          }
        : empty,
    );
  }, [open, editing]);

  const close = () => setProductSheet(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!f.name.trim()) e.name = "Give the product a name buyers will recognise.";
    const price = Number(f.price);
    if (!f.price || Number.isNaN(price) || price <= 0) e.price = "Enter a price above £0.";
    const q = Number(f.quantityAvailable);
    if (f.quantityAvailable === "" || !Number.isInteger(q) || q < 0) e.quantityAvailable = "Enter a whole number, 0 or more.";
    return e;
  };

  async function submit(ev?: FormEvent) {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    const body: ProductInput = {
      name: f.name.trim(),
      description: f.description.trim() || undefined,
      price: Math.round(Number(f.price) * 100) / 100,
      quantityAvailable: Number(f.quantityAvailable),
      category: f.category,
      bestBeforeDate: f.bestBeforeDate || undefined,
      pickupAddress: f.pickupAddress || undefined,
      tags: f.tags,
      // Real API: coverImage (file) + images[] (files) as multipart. The first photo is the cover.
      coverImageUrl: f.photos[0],
      imageUrls: f.photos.slice(1),
    };
    try {
      if (editing) {
        await update({ id: editing.id, ...body }).unwrap();
        toast.success("Changes saved", { description: body.name });
      } else {
        await create(body).unwrap();
        toast.success("Product listed", { description: `${body.name} is live for buyers nearby.` });
      }
      close();
    } catch {
      toast.error("That didn't save", { description: "Check your connection and try again." });
    }
  }

  async function remove() {
    if (!editing) return;
    const snapshot = editing;
    close();
    await del(snapshot.id);
    toast(`Deleted ${snapshot.name}`, {
      action: { label: "Undo", onClick: () => restore(snapshot) },
    });
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
  };

  const bb = f.bestBeforeDate ? daysUntil(f.bestBeforeDate) : null;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={editing ? editing.name : "New product"}
      subtitle={editing ? "Edit listing" : "List something you've got ready to sell."}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="mr-auto text-app-red hover:text-app-red" onClick={remove}>
              <Trash className="size-4" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => submit()} disabled={creating || updating} kbd="⌘↵">
            {editing ? "Save changes" : "List product"}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={submit} onKeyDown={onKeyDown} noValidate className="grid gap-5 px-5 py-5">
        <PhotosPicker value={f.photos} onChange={(v) => set("photos", v)} />

        <Field label="Name" required error={errors.name}>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Chantenay carrots" aria-invalid={!!errors.name} className={input(!!errors.name)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price" required error={errors.price} hint="Per unit, in pounds">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-faint">£</span>
              <input inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} placeholder="1.60" aria-invalid={!!errors.price} className={cn(input(!!errors.price), "num pl-7")} />
            </div>
          </Field>
          <Field label="In stock" required error={errors.quantityAvailable} hint="Units you can sell now">
            <input inputMode="numeric" value={f.quantityAvailable} onChange={(e) => set("quantityAvailable", e.target.value.replace(/\D/g, ""))} placeholder="40" aria-invalid={!!errors.quantityAvailable} className={cn(input(!!errors.quantityAvailable), "num")} />
          </Field>
        </div>

        <Field label="Category">
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
            {PRODUCT_CATEGORIES.map((c) => (
              <button
                type="button"
                role="radio"
                aria-checked={f.category === c}
                key={c}
                onClick={() => set("category", c)}
                className={cn(
                  "h-7 rounded-full px-3 text-ui-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96]",
                  f.category === c ? "bg-app-primary text-app-on-primary" : "text-app-muted shadow-[0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover hover:text-app-text",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Best before"
          hint={bb !== null && bb < 7 ? undefined : "Buyers see this on the listing"}
          note={
            bb !== null && bb < 7 ? (
              <span className="flex items-center gap-1.5 text-app-amber">
                <Warning weight="fill" className="size-3.5" />
                {bb < 0 ? "That date has passed." : bb === 0 ? "Best before today." : `Only ${bb} day${bb === 1 ? "" : "s"} left. Consider flagging it as surplus.`}
              </span>
            ) : undefined
          }
        >
          <input type="date" value={f.bestBeforeDate} onChange={(e) => set("bestBeforeDate", e.target.value)} className={cn(input(false), "num")} />
        </Field>

        <Field label="Tags" hint="Press Enter to add, like ‘Bunched’ or ‘Per kg’">
          <TagInput value={f.tags} onChange={(v) => set("tags", v)} />
        </Field>

        <Field label="Description">
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="How it's grown, how it's sold, anything a buyer should know." className={cn(input(false), "h-auto resize-none py-2")} />
        </Field>

        <Field label="Pickup address">
          <input value={f.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} className={input(false)} />
        </Field>
        <button type="submit" hidden />
      </form>
      <p className="px-5 pb-5 text-ui-sm text-app-faint">
        Press <Kbd>⌘</Kbd> <Kbd>↵</Kbd> to save from any field.
      </p>
    </Sheet>
  );
}

export const input = (invalid: boolean) =>
  cn(
    "h-9 w-full rounded-[7px] bg-app-panel px-3 text-app-text outline-none transition-shadow duration-150 placeholder:text-app-faint",
    invalid
      ? "shadow-[0_0_0_1px_var(--a-red),0_0_0_4px_var(--a-red-soft)]"
      : "shadow-[0_0_0_1px_var(--a-line-strong)] hover:shadow-[0_0_0_1px_var(--a-faint)] focus:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]",
  );

export function Field({ label, required, hint, note, error, children }: { label: string; required?: boolean; hint?: string; note?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-medium">
        {label}
        {required && <span className="text-app-faint"> *</span>}
      </span>
      {children}
      {error ? <span className="text-ui-sm text-app-red">{error}</span> : note ? <span className="text-ui-sm">{note}</span> : hint ? <span className="text-ui-sm text-app-faint">{hint}</span> : null}
    </label>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[7px] bg-app-panel px-1.5 py-1 shadow-[0_0_0_1px_var(--a-line-strong)] focus-within:shadow-[0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]">
      {value.map((t) => (
        <span key={t} className="inline-flex h-6 items-center gap-1 rounded-[5px] bg-app-hover pl-2 pr-1 text-ui-sm">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-4 place-items-center rounded text-app-faint hover:text-app-text">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        className="h-6 min-w-[8ch] flex-1 bg-transparent px-1 outline-none placeholder:text-app-faint"
        placeholder={value.length ? "" : "Add a tag"}
      />
    </div>
  );
}

const MAX_PHOTOS = 8;

/** Up to 8 photos. The first is the cover buyers see in the marketplace; any photo can be made the cover. */
function PhotosPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const add = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    onChange([...value, ...urls].slice(0, MAX_PHOTOS));
  };
  return (
    <div
      className="grid gap-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        add(e.dataTransfer.files);
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="font-medium">Photos</p>
        <p className="num text-ui-sm text-app-faint">
          {value.length} / {MAX_PHOTOS}
        </p>
      </div>
      <p className="-mt-1 text-ui-sm text-app-faint">The first photo is the cover. Add close-ups, the crate and the field. Drag files here or click to add.</p>
      <ul className="mt-1 grid grid-cols-4 gap-2">
        {value.map((src, i) => (
          <li key={src + i} className="group relative aspect-square overflow-hidden rounded-xl bg-app-hover shadow-[inset_0_0_0_1px_var(--a-line)]">
            <Image src={src} alt={`Photo ${i + 1}`} fill sizes="96px" unoptimized={src.startsWith("blob:")} className={/-cut\.|blob:/.test(src) ? "object-contain p-1.5" : "object-cover"} />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">Cover</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              {i > 0 ? (
                <button type="button" onClick={() => onChange([src, ...value.filter((_, k) => k !== i)])} className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur hover:bg-black/80">
                  Make cover
                </button>
              ) : (
                <span />
              )}
              <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(value.filter((_, k) => k !== i))} className="grid size-5 place-items-center rounded-md bg-black/60 text-white backdrop-blur hover:bg-black/80">
                <X weight="bold" className="size-3" />
              </button>
            </div>
          </li>
        ))}
        {value.length < MAX_PHOTOS && (
          <li>
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="group grid aspect-square w-full place-items-center rounded-xl text-app-faint shadow-[inset_0_0_0_1.5px_var(--a-line-strong)] [box-shadow:inset_0_0_0_1.5px_var(--a-line-strong)] transition-colors hover:bg-app-hover hover:text-app-muted"
              aria-label="Add photos"
            >
              <span className="grid justify-items-center gap-1">
                <ImageSquare className="size-5" />
                <span className="text-[11px] font-medium">Add</span>
              </span>
            </button>
          </li>
        )}
      </ul>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
    </div>
  );
}
