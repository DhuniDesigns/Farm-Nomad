"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { useMeQuery } from "@/lib/api/farmnomad";
import { Button } from "./ui";

/** Placeholder for later-release features (FRONTEND-CLAUDE.md R2/R3): what it is, when, and a way to hear first. */
export function ComingSoon({ icon, release, title, body, points, topic }: { icon: ReactNode; release: string; title: string; body: string; points: string[]; topic: string }) {
  const { data: me } = useMeQuery();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function notify(e: FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    try {
      const res = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: me.email, topic }) });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      toast.error("That didn't go through", { description: "Try again in a moment." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[560px] justify-items-start px-4 py-16 md:px-8 md:py-24">
      <div className="grid size-12 place-items-center rounded-2xl bg-app-accent-soft text-app-accent">{icon}</div>
      <p className="mt-6 text-ui-sm font-medium uppercase tracking-wide text-app-faint">Coming in {release}</p>
      <h1 className="mt-2 font-display text-[30px] font-medium leading-tight tracking-[-0.03em]">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-app-muted">{body}</p>
      <ul className="mt-6 grid gap-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <Check weight="bold" className="mt-0.5 size-4 shrink-0 text-app-accent" />
            {p}
          </li>
        ))}
      </ul>
      <form onSubmit={notify} className="mt-8">
        {done ? (
          <p className="flex items-center gap-2 text-app-accent">
            <Check weight="bold" className="size-4" /> We&apos;ll email {me?.email} when it&apos;s ready.
          </p>
        ) : (
          <Button type="submit" variant="primary" disabled={busy || !me}>
            Tell me when it&apos;s ready
          </Button>
        )}
      </form>
    </div>
  );
}
