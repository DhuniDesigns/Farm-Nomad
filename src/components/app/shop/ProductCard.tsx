"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { daysUntil, type Product } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { gbp } from "../ui";
import { QtyStepper } from "./QtyStepper";
import { useCart } from "./useCart";

// Calm tints per category so a grid of cut-out produce reads as a shelf, not a spreadsheet.
const tint: Record<string, string> = {
  Vegetables: "bg-[#EEF3E6] dark:bg-[#141C15]",
  Fruit: "bg-[#F6EEE6] dark:bg-[#1D1713]",
  Dairy: "bg-[#F4F1E8] dark:bg-[#1A1813]",
  Other: "bg-[#EEF1F0] dark:bg-[#141917]",
};

export const isSurplus = (p: Product) => !!p.tags?.some((t) => t.toLowerCase() === "surplus");

export function ProductCard({ p, priority }: { p: Product; priority?: boolean }) {
  const { itemFor, addToCart, setQty } = useCart();
  const inCart = itemFor(p.id);
  const out = p.quantityAvailable <= 0;
  const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
  const unit = p.tags?.find((t) => /per|box|punnet|bag|bunch/i.test(t));

  return (
    <article className="group relative flex flex-col">
      <Link href={`/marketplace/${p.id}`} className="block rounded-2xl focus-visible:outline-none" aria-label={`${p.name} from ${p.farmerName}`}>
        <div className={cn("relative grid aspect-square place-items-center overflow-hidden rounded-2xl", tint[p.category ?? "Other"] ?? tint.Other)}>
          {p.coverImageUrl && (
            <Image
              src={p.coverImageUrl}
              alt=""
              width={480}
              height={480}
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
              className={cn("w-[74%] object-contain transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover:scale-[1.05]", out && "opacity-40 grayscale")}
            />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {isSurplus(p) && <span className="rounded-full bg-app-primary px-2 py-0.5 text-[11px] font-semibold text-app-on-primary">Surplus deal</span>}
            {out && <span className="rounded-full bg-app-panel px-2 py-0.5 text-[11px] font-medium text-app-muted shadow-[0_0_0_1px_var(--a-line)]">Sold out</span>}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/marketplace/${p.id}`} className="block truncate font-medium hover:underline">
            {p.name}
          </Link>
          <p className="truncate text-ui-sm text-app-faint">{p.farmerName}</p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="num font-semibold">{gbp(p.price)}</span>
            {unit && <span className="truncate text-ui-sm text-app-faint">{unit.toLowerCase()}</span>}
          </p>
          {d !== null && d <= 3 && !out && <p className="mt-0.5 text-ui-sm text-app-amber">{d <= 0 ? "Best before today" : `Best before in ${d} day${d === 1 ? "" : "s"}`}</p>}
        </div>
        {/* Quick add: the + grows into a stepper once it's in your cart */}
        {!out && (
          <div className="shrink-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {inCart ? (
                <motion.div key="stepper" initial={{ opacity: 0, transform: "scale(0.9)" }} animate={{ opacity: 1, transform: "scale(1)" }} exit={{ opacity: 0, transform: "scale(0.9)" }} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
                  <QtyStepper size="sm" value={inCart.quantity} max={p.quantityAvailable} label={p.name} onChange={(n) => setQty(p.id, n)} />
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  type="button"
                  aria-label={`Add ${p.name} to cart`}
                  onClick={() => addToCart(p, 1, true)}
                  initial={{ opacity: 0, transform: "scale(0.9)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: "scale(0.9)" }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="grid size-8 place-items-center rounded-full bg-app-primary text-app-on-primary transition-transform duration-150 hover:opacity-90 active:scale-[0.92]"
                >
                  <Plus weight="bold" className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </article>
  );
}
