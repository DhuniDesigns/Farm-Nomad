"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAddToCartMutation, useGetCartQuery, useRemoveCartItemMutation, useUpdateCartQtyMutation } from "@/lib/api/farmnomad";
import type { Product } from "@/lib/types/api";

const message = (e: unknown) => ((e as { data?: { message?: string } })?.data?.message ?? "Try again in a moment.");

/** Cart actions with consistent feedback, shared by cards, the product page and the cart. */
export function useCart() {
  const router = useRouter();
  const { data: items = [] } = useGetCartQuery();
  const [add, { isLoading: adding }] = useAddToCartMutation();
  const [update] = useUpdateCartQtyMutation();
  const [remove] = useRemoveCartItemMutation();

  const itemFor = (productId: number) => items.find((i) => i.productId === productId);

  async function addToCart(p: Product, quantity = 1, quiet = false) {
    try {
      await add({ productId: p.id, quantity }).unwrap();
      if (!quiet)
        toast.success(`Added ${quantity > 1 ? `${quantity} × ` : ""}${p.name}`, {
          description: p.farmerName,
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
    } catch (e) {
      toast.error("Couldn't add that", { description: message(e) });
    }
  }

  async function setQty(productId: number, quantity: number) {
    const it = itemFor(productId);
    if (!it) return;
    if (quantity < 1) {
      await remove(it.id);
      return;
    }
    try {
      await update({ itemId: it.id, quantity }).unwrap();
    } catch (e) {
      toast.error("Couldn't change that", { description: message(e) });
    }
  }

  return { items, itemFor, addToCart, setQty, adding, count: items.reduce((s, i) => s + i.quantity, 0) };
}
