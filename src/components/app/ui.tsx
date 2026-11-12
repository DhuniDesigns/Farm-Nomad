"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ───────── Buttons ─────────
   Small and precise, Linear-sized. Press scales to 0.97; colour changes are 150ms. */
type Variant = "primary" | "secondary" | "ghost" | "danger";
const btn: Record<Variant, string> = {
  primary: "bg-app-primary text-app-on-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:opacity-90",
  secondary: "bg-app-panel text-app-text shadow-[0_0_0_1px_var(--a-line-strong),0_1px_2px_rgb(0_0_0/0.04)] hover:bg-app-hover",
  ghost: "text-app-muted hover:bg-app-hover hover:text-app-text",
  danger: "bg-app-red text-white hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; kbd?: string }>(
  function Button({ variant = "secondary", size = "md", kbd, className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium transition-[background-color,opacity,transform,color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-7 px-2.5 text-ui-sm" : "h-8 px-3 text-ui",
          btn[variant],
          className,
        )}
        {...rest}
      >
        {children}
        {kbd && <Kbd className={variant === "primary" ? "ml-1 bg-white/15 text-current shadow-none" : "ml-1"}>{kbd}</Kbd>}
      </button>
    );
  },
);

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[7px] text-app-muted transition-[background-color,color,transform] duration-150 hover:bg-app-hover hover:text-app-text active:scale-[0.94]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-[18px] min-w-[18px] place-items-center rounded-[4px] bg-app-hover px-1 font-ui text-[11px] font-medium text-app-muted shadow-[inset_0_-1px_0_var(--a-line)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* ───────── Status pill ───────── */
export type Tone = "neutral" | "green" | "amber" | "red" | "blue";
const tones: Record<Tone, string> = {
  neutral: "bg-app-hover text-app-muted",
  green: "bg-app-accent-soft text-app-accent",
  amber: "bg-app-amber-soft text-app-amber",
  red: "bg-app-red-soft text-app-red",
  blue: "bg-app-blue-soft text-app-blue",
};
export function Pill({ tone = "neutral", dot = true, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-ui-sm font-medium", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-app-hover", className)} />;
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-20 text-center">
      <div className="grid size-11 place-items-center rounded-xl bg-app-hover text-app-muted">{icon}</div>
      <p className="mt-4 text-[14px] font-medium">{title}</p>
      <p className="mt-1 max-w-[36ch] text-app-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s|,/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  // Stable, calm tint per name.
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      aria-hidden
      className={cn("inline-grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white", className)}
      style={{ background: `oklch(0.55 0.08 ${hue})` }}
    >
      {initials}
    </span>
  );
}

/* ───────── Formatting ───────── */
export const gbp = (n: number, dp = 2) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);

export function relDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
  if (days === 0) return "Today";
  if (days === -1) return "Yesterday";
  if (days === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const orderRef = (id: number) => `FN-${id}`;
