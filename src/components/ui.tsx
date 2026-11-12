"use client";

import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "accent" | "outline-light" | "outline" | "glass";

const variants: Record<Variant, string> = {
  // Forest on light, lime in dark mode (tokens swap)
  solid: "bg-solid text-on-solid hover:brightness-[1.15]",
  // Lime: the one accent, used on forest and photo grounds
  accent: "bg-accent text-on-accent hover:bg-lime-300",
  "outline-light": "text-on-forest ring-1 ring-inset ring-white/35 hover:bg-white/10 hover:ring-white/60",
  outline: "text-ink ring-1 ring-inset ring-line hover:bg-sunken",
  glass: "bg-white/15 text-on-forest backdrop-blur-md ring-1 ring-inset ring-white/25 hover:bg-white/25",
};

/** Pill button. Press scales to 0.97; the arrow nudges on hover. One shape for every action on the page. */
export function Button({
  href,
  children,
  variant = "solid",
  arrow = true,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-6 text-body font-medium",
        "transition-[transform,background-color,box-shadow,filter] duration-200 ease-[var(--ease-out)] active:scale-[0.97]",
        variants[variant],
        className,
      )}
    >
      {children}
      {arrow && (
        <span
          aria-hidden
          className={cn(
            "-mr-3.5 grid size-9 place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-out)] group-hover:rotate-[-45deg]",
            variant === "accent" ? "bg-forest text-accent" : variant === "solid" ? "bg-accent text-on-accent" : "bg-ink/[0.08] text-current",
          )}
        >
          <ArrowRight weight="bold" className="size-4" />
        </span>
      )}
    </a>
  );
}

/** The FarmNomad logo. "auto" follows the colour scheme; "on-dark" is for forest and photo grounds. */
export function Logo({ tone = "auto", className }: { tone?: "auto" | "on-light" | "on-dark"; className?: string }) {
  const base = cn("h-7 w-auto md:h-8", className);
  if (tone === "on-light") return <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} priority className={base} />;
  if (tone === "on-dark") return <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} priority className={base} />;
  return (
    <>
      <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} priority className={cn(base, "dark:hidden")} />
      <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} priority className={cn(base, "hidden dark:block")} />
    </>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-label text-muted", className)}>{children}</p>;
}
