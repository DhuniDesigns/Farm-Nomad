"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useConfirmCheckoutMutation } from "@/lib/api/farmnomad";
import type { Order } from "@/lib/types/api";
import { Button, Skeleton, orderRef } from "@/components/app/ui";

/** Spec §7.8: confirm the Stripe session from ?session_id, then show what was ordered. */
export default function CheckoutSuccessPage() {
  const [confirm] = useConfirmCheckoutMutation();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) return setFailed(true);
    confirm(id)
      .unwrap()
      .then(setOrders)
      .catch(() => setFailed(true));
  }, [confirm]);

  if (failed)
    return (
      <div className="mx-auto grid max-w-md place-items-center px-6 py-24 text-center">
        <h1 className="font-display text-[24px] font-medium tracking-[-0.02em]">We couldn&apos;t confirm that payment</h1>
        <p className="mt-2 text-app-muted">If you were charged, your order will still show up in My orders within a few minutes.</p>
        <div className="mt-6 flex gap-2">
          <Link href="/orders"><Button variant="primary">My orders</Button></Link>
          <Link href="/cart"><Button>Back to cart</Button></Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-md justify-items-center px-6 py-20 text-center">
      <svg viewBox="0 0 64 64" className="size-20" aria-hidden>
        <motion.circle cx="32" cy="32" r="30" fill="var(--a-accent-soft)" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} style={{ originX: "50%", originY: "50%" }} />
        <motion.path d="M20 33 l8 8 l16 -18" fill="none" stroke="var(--a-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.25, ease: [0.23, 1, 0.32, 1] }} />
      </svg>
      <h1 className="mt-6 font-display text-[28px] font-medium tracking-[-0.03em]">Order placed</h1>
      <p className="mt-2 text-app-muted">Paid, and on its way to the farm to be packed. We&apos;ll notify you when a driver picks it up.</p>

      <div className="mt-8 w-full rounded-xl p-4 text-left shadow-[0_0_0_1px_var(--a-line)]">
        {!orders ? (
          <div className="grid gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : (
          <ul className="grid gap-2">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="font-medium">{o.productName}</span>
                  <span className="num text-app-faint"> × {o.quantity}</span>
                </span>
                <span className="num text-app-faint">{orderRef(o.id)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex w-full gap-2">
        <Link href={orders?.[0] ? `/orders/${orders[0].id}` : "/orders"} className="flex-1">
          <Button variant="primary" className="h-10 w-full">Track order</Button>
        </Link>
        <Link href="/marketplace" className="flex-1">
          <Button className="h-10 w-full">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
