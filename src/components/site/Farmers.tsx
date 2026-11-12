"use client";

import Image from "next/image";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui";
import { ImageReveal } from "@/components/ImageReveal";
import { setJoinRole } from "@/components/site/Join";

const perks = [
  "List from your phone in the field, with photos, price and best-before date",
  "Sell to households, restaurants and wholesale buyers from one listing",
  "See orders, stock and payouts in one place",
  "Send what doesn't sell to food groups nearby",
];

export function Farmers() {
  return (
    <section id="farmers" className="scroll-mt-24 p-3 md:p-5">
      <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-[var(--radius-card)] bg-raised lg:grid-cols-2">
        <ImageReveal radius={0} className="min-h-[360px] lg:min-h-[760px]">
          <Image
            src="/images/greenhouse.webp"
            alt="Rows of leafy greens in a glasshouse at dusk under warm lights"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </ImageReveal>
        <div className="flex flex-col justify-center p-6 py-14 md:p-14 lg:p-20">
          <h2 className="max-w-[13ch] text-h2">List once and sell to every buyer nearby.</h2>
          <p className="mt-6 max-w-[44ch] text-lead text-muted">
            You set the price. FarmNomad handles payment and delivery, starting with farms across the North West.
          </p>
          <ul className="mt-10 grid gap-4">
            {perks.map((p) => (
              <li key={p} className="flex gap-3.5 border-t border-line pt-4 text-body">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mist text-moss dark:bg-white/10 dark:text-accent">
                  <Check aria-hidden weight="bold" className="size-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Button href="#join" className="mt-10 self-start" onClick={() => setJoinRole("Farmer")}>
            Register your farm
          </Button>
        </div>
      </div>
    </section>
  );
}
