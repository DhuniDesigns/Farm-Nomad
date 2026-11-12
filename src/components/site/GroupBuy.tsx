"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Community buying teaser. Marketing only: no pooling, joining or payment UI here.
 * Collects an email to tell people when group buying opens.
 */
export function GroupBuy() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "failed">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("sending");
    try {
      // POST /api/notify stores nothing yet; see the TODO in src/app/api/notify/route.ts.
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic: "group-buying" }),
      });
      setState(res.ok ? "done" : "failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <section id="group-buying" aria-labelledby="group-title" className="gutter scroll-mt-24 pb-24 md:pb-36">
      <div className="wrap grid overflow-hidden rounded-[var(--radius-card)] bg-mist text-[#10251B] dark:bg-[#16261B] dark:text-on-forest lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col justify-center p-6 py-12 md:p-14 lg:p-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#10251B] px-3 py-1.5 text-label font-medium uppercase tracking-[0.08em] text-accent dark:bg-accent dark:text-on-accent">
            <span className="size-1.5 rounded-full bg-current" />
            Coming soon
          </span>
          <h2 id="group-title" className="mt-6 text-h2">Buy together. Pay less.</h2>
          <p className="mt-5 max-w-[42ch] text-lead opacity-75">
            Pool your money with a group to buy direct from the farm at wholesale prices, then split the order between you.
          </p>

          <form onSubmit={submit} noValidate className="mt-10 max-w-md">
            <label htmlFor="notify-email" className="mb-2 block text-small opacity-70">
              Get an email when group buying opens
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="notify-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error" || state === "failed") setState("idle");
                }}
                aria-invalid={state === "error"}
                aria-describedby="notify-status"
                disabled={state === "done"}
                className={cn(
                  "min-h-12 flex-1 rounded-full bg-white px-5 text-body text-[#10251B] outline-none ring-1 ring-inset transition-shadow placeholder:text-[#10251B]/40 focus:ring-2 dark:bg-white/10 dark:text-on-forest dark:placeholder:text-on-forest/40",
                  state === "error" ? "ring-alert" : "ring-[#10251B]/15 focus:ring-moss dark:ring-white/15 dark:focus:ring-accent",
                )}
              />
              <button
                type="submit"
                disabled={state === "sending" || state === "done"}
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-[#10251B] pl-6 pr-1.5 font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-default dark:bg-accent dark:text-on-accent"
              >
                {state === "done" ? "You're on the list" : "Notify me"}
                <span aria-hidden className="grid size-9 place-items-center rounded-full bg-accent text-on-accent dark:bg-[#10251B] dark:text-accent">
                  {state === "sending" ? (
                    <CircleNotch className="size-4 animate-spin" />
                  ) : state === "done" ? (
                    <Check weight="bold" className="size-4" />
                  ) : (
                    <ArrowRight weight="bold" className="size-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-rotate-45" />
                  )}
                </span>
              </button>
            </div>
            <div id="notify-status" aria-live="polite" className="mt-2 min-h-5 text-small">
              <AnimatePresence mode="wait">
                {state === "error" && (
                  <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-alert dark:text-[#FFB4BF]">
                    Enter your full email address, like name@example.com
                  </motion.p>
                )}
                {state === "failed" && (
                  <motion.p key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-alert dark:text-[#FFB4BF]">
                    That didn&apos;t go through. Try again in a moment.
                  </motion.p>
                )}
                {state === "done" && (
                  <motion.p key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="opacity-70">
                    Thanks. We&apos;ll email {email} when group buying opens.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>

        <div className="relative grid min-h-[320px] place-items-center p-8 lg:min-h-0">
          <div aria-hidden className="absolute size-[70%] rounded-full bg-white/50 dark:bg-white/5" />
          <Image
            src="/images/crate-stack-cut.webp"
            alt="A stack of four produce crates filled with greens, apples, root vegetables and berries"
            width={934}
            height={1400}
            sizes="(min-width: 1024px) 30vw, 70vw"
            className="relative h-[300px] w-auto object-contain drop-shadow-[0_30px_40px_rgb(16_37_27/0.25)] sm:h-[380px] lg:h-[460px]"
          />
        </div>
      </div>
    </section>
  );
}
