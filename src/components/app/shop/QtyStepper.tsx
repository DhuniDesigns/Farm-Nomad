"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/** Compact − n + control. At 1 the minus becomes a bin so removing is explicit. */
export function QtyStepper({ value, max, onChange, size = "md", label }: { value: number; max: number; onChange: (n: number) => void; size?: "sm" | "md"; label: string }) {
  const h = size === "sm" ? "h-8" : "h-9";
  const b = "grid place-items-center rounded-full text-app-text transition-[background-color,transform] duration-150 hover:bg-app-hover active:scale-[0.9] disabled:opacity-35 disabled:pointer-events-none";
  return (
    <div role="group" aria-label={`Quantity of ${label}`} className={cn("inline-flex items-center rounded-full bg-app-panel p-0.5 shadow-[0_0_0_1px_var(--a-line-strong)]", h)}>
      <button type="button" aria-label={value <= 1 ? `Remove ${label}` : "One fewer"} onClick={() => onChange(value - 1)} className={cn(b, size === "sm" ? "size-7" : "size-8")}>
        {value <= 1 ? <Trash className="size-3.5" /> : <Minus weight="bold" className="size-3.5" />}
      </button>
      <span className="num min-w-7 text-center font-medium" aria-live="polite">{value}</span>
      <button type="button" aria-label="One more" disabled={value >= max} onClick={() => onChange(value + 1)} className={cn(b, size === "sm" ? "size-7" : "size-8")}>
        <Plus weight="bold" className="size-3.5" />
      </button>
    </div>
  );
}
