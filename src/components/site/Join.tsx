"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";

export const roles = ["Customer", "Farmer", "Community group", "Driver"] as const;
export type Role = (typeof roles)[number];

/** Lets other sections preselect a role before jumping to the form. */
export function setJoinRole(role: Role) {
  window.dispatchEvent(new CustomEvent<Role>("fn:role", { detail: role }));
}

const msg = { initial: { opacity: 0, transform: "translateY(-4px)" }, animate: { opacity: 1, transform: "translateY(0px)" }, exit: { opacity: 0 } };

/** Waitlist form, built for a light card. */
export function Join() {
  const [role, setRole] = useState<Role>("Customer");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "failed">("idle");

  useEffect(() => {
    const on = (e: Event) => setRole((e as CustomEvent<Role>).detail);
    window.addEventListener("fn:role", on);
    return () => window.removeEventListener("fn:role", on);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      setState(res.ok ? "done" : "failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <form id="join" onSubmit={submit} noValidate className="grid scroll-mt-28 gap-6">
      <fieldset>
        <legend className="mb-3 text-small text-muted">I&apos;m joining as a</legend>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={cn(
                "relative min-h-12 rounded-full px-4 text-small font-medium transition-[color,transform] duration-200 active:scale-[0.97]",
                role === r ? "text-on-solid" : "text-ink ring-1 ring-inset ring-line [@media(hover:hover)]:hover:bg-sunken",
              )}
            >
              {role === r && (
                <motion.span layoutId="role" aria-hidden className="absolute inset-0 rounded-full bg-solid" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />
              )}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="join-email" className="mb-2 block text-small text-muted">Email</label>
        <input
          id="join-email"
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
          aria-describedby="join-status"
          className={cn(
            "min-h-14 w-full rounded-2xl bg-sunken px-5 text-body text-ink placeholder:text-ink/35 ring-1 ring-inset transition-shadow duration-200 focus:outline-none focus:ring-2",
            state === "error" ? "ring-alert focus:ring-alert" : "ring-transparent focus:ring-moss dark:focus:ring-accent",
          )}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="submit"
          disabled={state === "sending" || state === "done"}
          className="group inline-flex min-h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-solid pl-6 pr-1.5 font-medium text-on-solid transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-default"
        >
          {state === "done" ? "You're on the list" : state === "sending" ? "Sending" : "Join the waitlist"}
          <span aria-hidden className="grid size-9 place-items-center rounded-full bg-accent text-on-accent">
            {state === "sending" ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : state === "done" ? (
              <Check weight="bold" className="size-4" />
            ) : (
              <ArrowRight weight="bold" className="size-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-rotate-45" />
            )}
          </span>
        </button>
        <p className="text-label text-muted">We only email you about FarmNomad.</p>
      </div>

      <div id="join-status" aria-live="polite" className="-mt-2 min-h-5 text-small">
        <AnimatePresence mode="wait">
          {state === "error" && (
            <motion.p key="e" {...msg} className="text-alert">Enter your full email address, like name@example.com</motion.p>
          )}
          {state === "failed" && (
            <motion.p key="f" {...msg} className="text-alert">That didn&apos;t go through. Check your connection and try again.</motion.p>
          )}
          {state === "done" && (
            <motion.p key="d" {...msg} className="text-muted">
              Thanks. We&apos;ll email {email} when FarmNomad opens for {role === "Community group" ? "community groups" : `${role.toLowerCase()}s`}.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
