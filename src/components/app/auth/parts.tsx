"use client";

import { motion } from "motion/react";
import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Check, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * Auth-screen parts. Larger and more tactile than the in-app controls: filled inputs,
 * a bevelled primary button with an arrow chip, and a segmented switch.
 */

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="relative grid h-11 grid-cols-2 rounded-full bg-app-hover p-1 shadow-[inset_0_0_0_1px_var(--a-line)]">
      {options.map(([v, text]) => {
        const on = v === value;
        return (
          <button
            key={v}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(v)}
            className={cn("relative rounded-full px-5 text-[14px] font-medium transition-colors duration-200", on ? "text-app-accent" : "text-app-faint hover:text-app-muted")}
          >
            {on && (
              <motion.span
                layoutId="auth-seg"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                className="absolute inset-0 rounded-full bg-app-panel shadow-[0_0_0_1px_var(--a-line-strong),0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.06)] dark:bg-black"
              />
            )}
            <span className="relative">{text}</span>
          </button>
        );
      })}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; error?: string; hint?: string; trailing?: ReactNode; labelAside?: ReactNode };

export const AuthInput = forwardRef<HTMLInputElement, InputProps>(function AuthInput({ label, icon, error, hint, trailing, labelAside, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={fid} className="text-[13px] font-medium text-app-muted">
          {label}
          {rest.required && <span className="text-app-faint"> *</span>}
        </label>
        {labelAside}
      </div>
      <div
        className={cn(
          "group flex h-12 items-center gap-2.5 rounded-[14px] bg-app-hover px-3.5 transition-[box-shadow,background-color] duration-150",
          "focus-within:bg-app-panel",
          error
            ? "shadow-[inset_0_0_0_1px_var(--a-red),0_0_0_4px_var(--a-red-soft)]"
            : "shadow-[inset_0_0_0_1px_var(--a-line)] hover:shadow-[inset_0_0_0_1px_var(--a-line-strong)] focus-within:shadow-[inset_0_0_0_1px_var(--a-accent),0_0_0_4px_var(--a-accent-soft)]",
        )}
      >
        {icon && <span className="shrink-0 text-app-faint transition-colors group-focus-within:text-app-accent">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${fid}-note` : undefined}
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-[15px] text-app-text outline-none placeholder:text-app-faint"
          {...rest}
        />
        {trailing}
      </div>
      {(error || hint) && (
        <p id={`${fid}-note`} className={cn("text-ui-sm", error ? "text-app-red" : "text-app-faint")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

/** Bevelled primary button: gradient fill, top highlight, inner shadow, arrow chip that nudges on hover. */
export function PrimaryButton({ loading, children, className, arrow = true, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; arrow?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "group relative flex h-12 w-full select-none items-center justify-center gap-2 overflow-hidden rounded-[14px] px-4 text-[15px] font-medium",
        "transition-[transform,filter,opacity] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        // Light: forest green. Dark: brand lime.
        "bg-[linear-gradient(180deg,#1f5138_0%,#10251B_100%)] text-white",
        "shadow-[0_0_0_1px_#0a1a12,inset_0_1px_0_rgb(255_255_255/0.2),inset_0_-2px_0_rgb(0_0_0/0.25),0_8px_20px_-8px_rgb(16_37_27/0.7)]",
        "dark:bg-[linear-gradient(180deg,#D3F29C_0%,#A9D85B_100%)] dark:text-[#0B1A10]",
        "dark:shadow-[0_0_0_1px_#7FAE3A,inset_0_1px_0_rgb(255_255_255/0.55),inset_0_-2px_0_rgb(0_0_0/0.12),0_8px_24px_-10px_rgb(185_230_111/0.55)]",
        "hover:brightness-110 dark:hover:brightness-105",
        className,
      )}
    >
      {/* Soft sheen across the top half */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgb(255_255_255/0.08),transparent)]" />
      <span className="relative">{children}</span>
      {arrow && (
        <span
          aria-hidden
          className="absolute right-1.5 grid size-9 place-items-center rounded-[10px] bg-white/10 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-transform duration-200 ease-out group-hover:translate-x-0.5 dark:bg-black/10 dark:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
        >
          {loading ? <CircleNotch className="size-4 animate-spin" /> : <ArrowRight weight="bold" className="size-4" />}
        </span>
      )}
    </button>
  );
}

/** Quiet bordered button (social sign-in, secondary actions). */
export function SoftButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex h-12 items-center justify-center gap-2.5 rounded-[14px] bg-app-panel px-4 text-[14px] font-medium text-app-text",
        "shadow-[0_0_0_1px_var(--a-line-strong),inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.05)] dark:bg-[#111] dark:shadow-[0_0_0_1px_var(--a-line-strong),inset_0_1px_0_rgb(255_255_255/0.06)]",
        "transition-[background-color,transform] duration-150 ease-out hover:bg-app-hover active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-2.5 text-[13px] text-app-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-px grid size-[18px] shrink-0 place-items-center rounded-[6px] transition-[background-color,box-shadow] duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent",
          checked ? "bg-app-accent text-white dark:text-black" : "bg-app-panel shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]",
        )}
      >
        {checked && <Check weight="bold" className="size-3" />}
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-ui-sm text-app-faint">
      <span className="h-px flex-1 bg-app-line" />
      {children}
      <span className="h-px flex-1 bg-app-line" />
    </div>
  );
}

/** Small selectable chip, for multi-choice fields like "What do you grow?". */
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3.5 text-[13px] font-medium transition-[background-color,box-shadow,color] duration-150 active:scale-[0.97]",
        on ? "bg-app-accent-soft text-app-accent shadow-[inset_0_0_0_1px_var(--a-accent)]" : "text-app-muted shadow-[inset_0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover hover:text-app-text",
      )}
    >
      {children}
    </button>
  );
}
