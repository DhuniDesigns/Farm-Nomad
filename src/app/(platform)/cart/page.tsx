"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Lock, ShoppingBagOpen, Storefront } from "@phosphor-icons/react/dist/ssr";
import { useAddToCartMutation, useClearCartMutation, useGetCartQuery, useRemoveCartItemMutation } from "@/lib/api/farmnomad";
import type { CartItem } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { QtyStepper } from "@/components/app/shop/QtyStepper";
import { useCart } from "@/components/app/shop/useCart";
import { Button, EmptyState, Skeleton, gbp } from "@/components/app/ui";

export default function CartPage() {
  const router = useRouter();
  const { data: items, isLoading } = useGetCartQuery();
  const { setQty } = useCart();
  const [remove] = useRemoveCartItemMutation();
  const [readd] = useAddToCartMutation();
  const [clear] = useClearCartMutation();

  const subtotal = items?.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0) ?? 0;
  const count = items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const farms = new Set(items?.map((i) => i.product?.farmerName)).size;

  async function removeItem(i: CartItem) {
    await remove(i.id);
    toast(`Removed ${i.product?.name}`, { action: { label: "Undo", onClick: () => readd({ productId: i.productId, quantity: i.quantity }) } });
  }

  async function clearAll() {
    const snapshot = items ?? [];
    await clear();
    toast("Cart cleared", {
      action: { label: "Undo", onClick: () => snapshot.forEach((i) => readd({ productId: i.productId, quantity: i.quantity })) },
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader
        title="Cart"
        description={count ? `${count} item${count === 1 ? "" : "s"} from ${farms} farm${farms === 1 ? "" : "s"}` : undefined}
        actions={count ? <Button variant="ghost" onClick={clearAll}>Clear cart</Button> : undefined}
      />
      {isLoading ? (
        <div className="grid gap-3 px-4 md:px-8">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !items?.length ? (
        <EmptyState
          icon={<ShoppingBagOpen className="size-5" />}
          title="Your cart is empty"
          body="Browse what farms near you have ready this week."
          action={
            <Link href="/marketplace">
              <Button variant="primary">
                <Storefront className="size-4" /> Go to the marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid items-start gap-6 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.li
                  key={i.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className="flex items-center gap-4 border-b border-app-line p-4 last:border-0"
                >
                  <Link href={`/marketplace/${i.productId}`} className="grid size-16 shrink-0 place-items-center rounded-xl bg-app-hover">
                    {i.product?.coverImageUrl && <Image src={i.product.coverImageUrl} alt="" width={96} height={96} className="size-14 object-contain" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/marketplace/${i.productId}`} className="block truncate font-medium hover:underline">
                      {i.product?.name}
                    </Link>
                    <p className="truncate text-ui-sm text-app-faint">
                      {i.product?.farmerName} · <span className="num">{gbp(i.product?.price ?? 0)}</span> each
                    </p>
                    <div className="mt-2 flex items-center gap-3 sm:hidden">
                      <QtyStepper size="sm" value={i.quantity} max={i.product?.quantityAvailable ?? 99} label={i.product?.name ?? "item"} onChange={(n) => (n < 1 ? removeItem(i) : setQty(i.productId, n))} />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <QtyStepper size="sm" value={i.quantity} max={i.product?.quantityAvailable ?? 99} label={i.product?.name ?? "item"} onChange={(n) => (n < 1 ? removeItem(i) : setQty(i.productId, n))} />
                  </div>
                  <p className="num w-20 shrink-0 text-right font-medium">{gbp((i.product?.price ?? 0) * i.quantity)}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] lg:sticky lg:top-6" aria-label="Order summary">
            <h2 className="font-medium">Summary</h2>
            <dl className="mt-4 grid gap-2.5">
              <div className="flex justify-between">
                <dt className="text-app-muted">Subtotal</dt>
                <dd className="num">{gbp(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-app-muted">Delivery</dt>
                <dd className="text-app-muted">Worked out at checkout</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-app-line pt-3 text-[15px]">
                <dt className="font-medium">Total so far</dt>
                <dd className="num font-display text-[20px] font-medium tracking-[-0.02em]">{gbp(subtotal)}</dd>
              </div>
            </dl>
            <Button variant="primary" className="mt-5 h-10 w-full" onClick={() => router.push("/checkout")}>
              Continue to checkout <ArrowRight className="size-4" />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-ui-sm text-app-faint">
              <Lock className="size-3.5" /> Secure payment with Stripe
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
