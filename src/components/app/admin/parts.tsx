"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { Role } from "@/lib/types/api";
import { Button, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  FARMER: "Farmer",
  CUSTOMER: "Customer",
  DRIVER: "Driver",
  ORGANISATION: "Food group",
  KITCHEN: "Kitchen",
};

const roleTint: Record<Role, string> = {
  ADMIN: "bg-app-hover text-app-text",
  FARMER: "bg-app-accent-soft text-app-accent",
  CUSTOMER: "bg-app-blue-soft text-app-blue",
  DRIVER: "bg-app-amber-soft text-app-amber",
  ORGANISATION: "bg-[#F3EEFB] text-[#6B3FA0] dark:bg-[#231a30] dark:text-[#C9A8F0]",
  KITCHEN: "bg-app-red-soft text-app-red",
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold", roleTint[role])}>{roleLabel[role]}</span>;
}

/** Segmented filter with counts. */
export function Filters<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; n?: number }[]; id: string }) {
  return (
    <div role="tablist" className="-mx-4 flex gap-0.5 overflow-x-auto px-4 md:mx-0 md:px-0">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 transition-colors", value === o.id ? "text-app-text" : "text-app-muted hover:text-app-text")}>
          {value === o.id && <motion.span layoutId={`f-${id}`} className="absolute inset-0 rounded-[7px] bg-app-active" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />}
          <span className="relative">{o.label}</span>
          {o.n !== undefined && <span className="num relative text-ui-sm text-app-faint">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-8 w-full items-center gap-2 rounded-[7px] bg-app-panel px-2.5 text-app-faint shadow-[0_0_0_1px_var(--a-line)] focus-within:shadow-[0_0_0_1px_var(--a-accent)] sm:w-64">
      <MagnifyingGlass className="size-4 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-app-text outline-none placeholder:text-app-faint" />
    </label>
  );
}

/** A plain table shell: header row + rows, horizontal scroll on phones. */
export function Table({ head, children, loading, empty, minWidth = 720 }: { head: ReactNode[]; children: ReactNode; loading?: boolean; empty?: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-app-line text-ui-sm text-app-faint">
            {head.map((h, i) => (
              <th key={i} scope="col" className="h-9 px-4 font-medium first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [0, 1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td colSpan={head.length} className="px-5 py-2">
                  <Skeleton className="h-8" />
                </td>
              </tr>
            ))
          ) : empty ? (
            <tr>
              <td colSpan={head.length}>{empty}</td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export const td = "px-4 py-2.5 first:pl-5 last:pr-5 align-middle";
export const tr = "border-b border-app-line last:border-0 transition-colors hover:bg-app-hover/60";

/** Centered confirm for actions that can't simply be undone. */
export function Confirm({ open, title, body, action, danger, onConfirm, onClose, busy }: { open: boolean; title: string; body: ReactNode; action: string; danger?: boolean; onConfirm: () => void; onClose: () => void; busy?: boolean }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => btn.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <motion.div className="absolute inset-0 bg-black/30 dark:bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-[400px] rounded-2xl bg-app-panel p-5 shadow-pop"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="font-display text-[19px] font-medium tracking-[-0.02em]">{title}</p>
            <div className="mt-1.5 text-app-muted">{body}</div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button ref={btn} variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
                {action}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    // Inside the app root so it picks up the light/dark choice.
    document.querySelector(".fn-app") ?? document.body,
  );
}
