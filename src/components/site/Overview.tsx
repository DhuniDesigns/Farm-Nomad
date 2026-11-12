"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui";
import { setJoinRole } from "@/components/site/Join";

const ease = [0.23, 1, 0.32, 1] as const;

export function Overview() {
  return (
    <section id="what" className="gutter py-24 md:py-36">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end">
          <h2 className="max-w-[12ch] text-h2">Local food, the short way round.</h2>
          <p className="text-lead text-muted">
            Growers list what they have, buyers order it, drivers move it and food groups claim what&apos;s left.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-12">
          {/* Photo card */}
          <article className="flex flex-col rounded-[var(--radius-card)] bg-raised p-2 lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] lg:aspect-auto lg:flex-1">
              <Image
                src="/images/step-list.webp"
                alt="A farmer kneeling in a carrot field, photographing a bunch of carrots with his phone"
                fill
                sizes="(min-width: 1024px) 40vw, 95vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-forest/55 px-3 py-1.5 text-label font-medium text-on-forest backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-accent" />
                Listed from the field
              </span>
            </div>
            <div className="px-4 pb-4 pt-6">
              <h3 className="text-h3">Farmers list what&apos;s ready</h3>
              <p className="mt-2 text-body text-muted">A photo, a price and a best-before date. Homes, kitchens and wholesale buyers nearby see it straight away.</p>
            </div>
          </article>

          {/* Stat card */}
          <article className="flex min-h-[460px] flex-col justify-between rounded-[var(--radius-card)] bg-mist p-6 text-[#10251B] lg:col-span-3 dark:bg-[#1A2B1F] dark:text-on-forest">
            <Ring value={0.072} />
            <div>
              <p className="font-display text-[2.75rem] font-medium leading-none tracking-[-0.05em] tabular">3.6m tonnes</p>
              <h3 className="mt-3 text-body font-medium">wasted or left as surplus on UK farms each year</h3>
              <p className="mt-1 text-small opacity-70">About 7 in every 100 tonnes harvested.</p>
              <p className="mt-4 font-mono text-label opacity-60">Source: WRAP</p>
            </div>
          </article>

          {/* Surplus card */}
          <article id="surplus" className="relative flex min-h-[460px] scroll-mt-28 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-forest p-6 text-on-forest lg:col-span-4">
            <div aria-hidden className="absolute -right-16 -top-16 size-72 rounded-full bg-accent/15" />
            <Image
              src="/images/bag-cut.webp"
              alt="Green FarmNomad tote bag filled with spring onions, broccoli, peppers and eggs"
              width={720}
              height={900}
              sizes="(min-width: 1024px) 20vw, 50vw"
              className="relative mx-auto w-[46%] drop-shadow-[0_24px_30px_rgb(0_0_0/0.35)] transition-transform duration-700 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:rotate-[-3deg] lg:w-[52%]"
            />
            <div className="relative">
              <h3 className="text-h3">Surplus goes to food groups</h3>
              <p className="mt-2 text-body text-on-forest-muted">Food banks, schools, faith and student groups nearby are told first and claim what they can use.</p>
              <Button href="#join" variant="accent" className="mt-6 min-h-11 pl-5 text-small" onClick={() => setJoinRole("Community group")}>
                Register a food group
              </Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Ring({ value }: { value: number }) {
  // Unit chart: 100 squares, one per percent of the UK harvest. The share left on farms fills in.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  const filled = Math.round(value * 100);
  return (
    <div>
      <div ref={ref} className="grid grid-cols-10 gap-1.5" role="img" aria-label={`${filled} in every 100 tonnes harvested`}>
        {Array.from({ length: 100 }, (_, i) => {
          const on = i >= 100 - filled;
          return (
            <motion.span
              key={i}
              className={on ? "aspect-square rounded-[3px] bg-moss dark:bg-accent" : "aspect-square rounded-[3px] bg-current opacity-[0.12]"}
              initial={on && !reduce ? { opacity: 0, transform: "scale(0.6)" } : false}
              animate={on && inView ? { opacity: 1, transform: "scale(1)" } : {}}
              transition={{ duration: 0.5, ease, delay: 0.3 + (i - (100 - filled)) * 0.08 }}
            />
          );
        })}
      </div>

    </div>
  );
}
