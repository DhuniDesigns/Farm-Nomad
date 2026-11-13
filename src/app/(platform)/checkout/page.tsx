"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Lock, MapPin, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { useCreateCheckoutSessionMutation, useGetCartQuery, useMeQuery, useUpdateMeMutation } from "@/lib/api/farmnomad";
import { Field, input } from "@/components/app/ProductSheet";
import { Button, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

/**
 * Review before paying. The real flow (spec §7.8) calls POST /checkout/create-session and sends the
 * browser to the Stripe Checkout URL it returns; card details are only ever entered on Stripe.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { data: items, isLoading } = useGetCartQuery();
  const { data: me } = useMeQuery();
  const [update, { isLoading: saving }] = useUpdateMeMutation();
  const [createSession, { isLoading: paying }] = useCreateCheckoutSessionMutation();
  const [editing, setEditing] = useState(false);
  const [addr, setAddr] = useState({ address: "", city: "", postcode: "", phoneNumber: "" });

  useEffect(() => {
    if (me) setAddr({ address: me.address ?? "", city: me.city ?? "", postcode: me.postcode ?? "", phoneNumber: me.phoneNumber ?? "" });
  }, [me]);
  useEffect(() => {
    if (items && !items.length) router.replace("/cart");
  }, [items, router]);

  const subtotal = items?.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0) ?? 0;
  const missing = !addr.address.trim() || !addr.postcode.trim();

  async function saveAddress() {
    if (!me || missing) return;
    try {
      await update({ id: me.id, ...addr }).unwrap();
      setEditing(false);
    } catch {
      toast.error("Couldn't save your address");
    }
  }

  async function pay() {
    if (missing) {
      setEditing(true);
      return;
    }
    try {
      const { checkoutUrl } = await createSession().unwrap();
      window.location.href = checkoutUrl;
    } catch (e) {
      toast.error("Couldn't start checkout", { description: (e as { data?: { message?: string } })?.data?.message ?? "Try again in a moment." });
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 md:px-8">
      <div className="pt-5">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-app-muted transition-colors hover:text-app-text">
          <ArrowLeft className="size-4" /> Cart
        </Link>
      </div>
      <h1 className="mt-4 font-display text-[26px] font-medium tracking-[-0.03em]">Checkout</h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <section className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]" aria-labelledby="deliver-title">
            <div className="flex items-center justify-between">
              <h2 id="deliver-title" className="font-medium">Deliver to</h2>
              {!editing && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <PencilSimple className="size-3.5" /> Change
                </Button>
              )}
            </div>
            {!me ? (
              <Skeleton className="mt-3 h-12 w-2/3" />
            ) : editing ? (
              <div className="mt-4 grid gap-3">
                <Field label="Address" required error={!addr.address.trim() ? "Add the street address." : undefined}>
                  <input value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} className={input(!addr.address.trim())} autoComplete="street-address" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Town or city">
                    <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={input(false)} autoComplete="address-level2" />
                  </Field>
                  <Field label="Postcode" required error={!addr.postcode.trim() ? "Add a postcode." : undefined}>
                    <input value={addr.postcode} onChange={(e) => setAddr({ ...addr, postcode: e.target.value.toUpperCase() })} className={cn(input(!addr.postcode.trim()), "uppercase")} autoComplete="postal-code" />
                  </Field>
                </div>
                <Field label="Phone" hint="So the driver can reach you at the door">
                  <input value={addr.phoneNumber} onChange={(e) => setAddr({ ...addr, phoneNumber: e.target.value })} className={input(false)} autoComplete="tel" inputMode="tel" />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" onClick={saveAddress} disabled={saving || missing}>Save address</Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-app-muted" />
                <div>
                  <p className="font-medium">{me.fullName}</p>
                  <p className="text-app-muted">
                    {[addr.address, addr.city, addr.postcode].filter(Boolean).join(", ") || "No address yet"}
                  </p>
                  {addr.phoneNumber && <p className="text-app-faint">{addr.phoneNumber}</p>}
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-labelledby="items-title">
            <h2 id="items-title" className="border-b border-app-line px-5 py-3 font-medium">Items</h2>
            {isLoading ? (
              <Skeleton className="m-5 h-12" />
            ) : (
              <ul>
                {items?.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 border-b border-app-line px-5 py-3 last:border-0">
                    <span className="grid size-11 place-items-center rounded-lg bg-app-hover">
                      {i.product?.coverImageUrl && <Image src={i.product.coverImageUrl} alt="" width={64} height={64} className="size-9 object-contain" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.product?.name}</p>
                      <p className="text-ui-sm text-app-faint">{i.product?.farmerName}</p>
                    </div>
                    <p className="num text-app-muted">× {i.quantity}</p>
                    <p className="num w-20 text-right">{gbp((i.product?.price ?? 0) * i.quantity)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)] lg:sticky lg:top-6" aria-label="Payment">
          <dl className="grid gap-2.5">
            <div className="flex justify-between">
              <dt className="text-app-muted">Subtotal</dt>
              <dd className="num">{gbp(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-app-muted">Delivery</dt>
              <dd className="text-app-muted">Shown on the payment page</dd>
            </div>
          </dl>
          <Button variant="primary" className="mt-5 h-11 w-full text-[14px]" onClick={pay} disabled={paying || !items?.length}>
            <Lock weight="fill" className="size-4" /> {paying ? "Opening secure payment" : `Pay ${gbp(subtotal)}`}
          </Button>
          <p className="mt-3 text-center text-ui-sm text-app-faint">You&apos;ll enter your card on Stripe&apos;s secure page. FarmNomad never sees your card details.</p>
        </aside>
      </div>
    </div>
  );
}
