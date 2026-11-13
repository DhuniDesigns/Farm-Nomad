"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CalendarBlank, Check, MapPin, Package, Plant, Truck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { useGetProductQuery, useListProductsQuery } from "@/lib/api/farmnomad";
import { daysUntil } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { ProductCard, isSurplus } from "@/components/app/shop/ProductCard";
import { Gallery, Lightbox, PhotoGrid } from "@/components/app/shop/Gallery";
import { QtyStepper } from "@/components/app/shop/QtyStepper";
import { useCart } from "@/components/app/shop/useCart";
import { Avatar, Button, EmptyState, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const id = Number(productId);
  const { data: p, isLoading, isError } = useGetProductQuery(id);
  const { data: all } = useListProductsQuery();
  const { role } = useApp();
  const { itemFor, addToCart, setQty, adding } = useCart();
  const [qty, setLocalQty] = useState(1);
  const [viewer, setViewer] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="grid content-start gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-6 h-10 w-1/2" />
        </div>
      </div>
    );
  if (isError || !p)
    return (
      <EmptyState
        icon={<Package className="size-5" />}
        title="That listing isn't available"
        body="It may have sold out or been taken down by the farm."
        action={
          <Link href="/marketplace">
            <Button>Back to the marketplace</Button>
          </Link>
        }
      />
    );

  const inCart = itemFor(p.id);
  const out = p.quantityAvailable <= 0;
  const d = p.bestBeforeDate ? daysUntil(p.bestBeforeDate) : null;
  const images = [p.coverImageUrl, ...(p.imageUrls ?? [])].filter(Boolean) as string[];
  const town = p.pickupAddress?.split(",").slice(-1)[0]?.trim().replace(/\s+[A-Z]{1,2}\d.*$/, "");
  const more = (all ?? []).filter((x) => x.farmerName === p.farmerName && x.id !== p.id).slice(0, 4);
  const own = role === "FARMER" && p.farmerName === "Hollins Farm";

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-[1100px] px-4 pt-5 md:px-8">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-app-muted transition-colors hover:text-app-text">
          <ArrowLeft className="size-4" /> Marketplace
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 pt-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-12 md:px-8">
        {/* Gallery */}
        <Gallery
          images={images}
          name={p.name}
          dim={out}
          onOpen={setViewer}
          badge={isSurplus(p) && <span className="absolute left-4 top-4 rounded-full bg-app-primary px-2.5 py-1 text-ui-sm font-semibold text-app-on-primary">Surplus deal</span>}
        />

        {/* Details */}
        <div className="min-w-0">
          <p className="text-app-muted">{p.category}</p>
          <h1 className="mt-1 font-display text-[clamp(28px,2.4vw+16px,40px)] font-medium leading-[1.05] tracking-[-0.035em]">{p.name}</h1>

          <div className="mt-5 flex items-center gap-3 rounded-xl p-3 shadow-[0_0_0_1px_var(--a-line)]">
            <Avatar name={p.farmerName ?? "Farm"} className="size-9 text-[12px]" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{p.farmerName}</p>
              <p className="flex items-center gap-1 text-ui-sm text-app-faint">
                <MapPin className="size-3.5" /> {town}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="num font-display text-[34px] font-medium leading-none tracking-[-0.03em]">{gbp(p.price)}</span>
            {p.tags?.[0] && <span className="text-app-muted">{p.tags.find((t) => /per|box|punnet|bag|bunch/i.test(t))?.toLowerCase() ?? "each"}</span>}
          </div>

          <ul className="mt-5 grid gap-2 text-app-muted">
            <li className="flex items-center gap-2.5">
              <Package className="size-4 shrink-0" />
              {out ? <span className="text-app-red">Sold out for now</span> : <span><span className="num text-app-text">{p.quantityAvailable}</span> available</span>}
            </li>
            {d !== null && (
              <li className="flex items-center gap-2.5">
                <CalendarBlank className="size-4 shrink-0" />
                <span className={cn(d <= 3 && "text-app-amber")}>
                  Best before {new Date(p.bestBeforeDate!).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  {d <= 3 && (d <= 0 ? ", today" : `, in ${d} day${d === 1 ? "" : "s"}`)}
                </span>
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0" />
              Delivered by a local driver, tracked from the farm gate
            </li>
          </ul>

          {/* Buy */}
          {own ? (
            <div className="mt-7 rounded-xl bg-app-hover p-4 text-app-muted">
              This is one of your listings.{" "}
              <Link href="/products" className="font-medium text-app-text underline underline-offset-2">
                Edit it in Products
              </Link>
            </div>
          ) : role === "FARMER" ? null : out ? (
            <div className="mt-7 rounded-xl bg-app-hover p-4 text-app-muted">This sold out. Farms usually relist within the week.</div>
          ) : inCart ? (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <QtyStepper value={inCart.quantity} max={p.quantityAvailable} label={p.name} onChange={(n) => setQty(p.id, n)} />
              <Link href="/cart" className="flex-1">
                <Button variant="primary" className="h-10 w-full">
                  <Check weight="bold" className="size-4" /> In your cart · View cart
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <QtyStepper value={qty} max={p.quantityAvailable} label={p.name} onChange={(n) => setLocalQty(Math.max(1, n))} />
              <Button variant="primary" className="h-10 flex-1" disabled={adding} onClick={() => addToCart(p, qty)}>
                Add to cart · <span className="num">{gbp(p.price * qty)}</span>
              </Button>
            </div>
          )}

          {!!p.tags?.length && (
            <div className="mt-7 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="rounded-full bg-app-hover px-2.5 py-1 text-ui-sm text-app-muted">
                  {t}
                </span>
              ))}
            </div>
          )}

          {p.description && (
            <div className="mt-7 border-t border-app-line pt-6">
              <h2 className="font-medium">About this produce</h2>
              <p className="mt-2 max-w-[60ch] leading-relaxed text-app-muted">{p.description}</p>
            </div>
          )}
          {p.pickupAddress && (
            <div className="mt-6 border-t border-app-line pt-6">
              <h2 className="font-medium">Collected from</h2>
              <p className="mt-2 flex items-start gap-2 text-app-muted">
                <Plant className="mt-0.5 size-4 shrink-0" /> {p.pickupAddress}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#EAF2DF] p-4 text-[#10251B] dark:bg-[#141E15] dark:text-app-text">
            <UsersThree weight="duotone" className="mt-0.5 size-5 shrink-0 text-app-accent" />
            <p className="text-ui">
              <span className="font-medium">Buying for a group?</span> Group buying at wholesale prices is coming soon.{" "}
              <Link href="/#group-buying" className="underline underline-offset-2">
                Get notified
              </Link>
            </p>
          </div>
        </div>
      </div>

      <PhotoGrid images={images} name={p.name} onOpen={setViewer} />
      <Lightbox images={images} index={viewer} name={p.name} onClose={() => setViewer(null)} />

      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1100px] px-4 md:px-8" aria-labelledby="more-title">
          <h2 id="more-title" className="font-display text-[22px] font-medium tracking-[-0.02em]">
            More from {p.farmerName}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {more.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
