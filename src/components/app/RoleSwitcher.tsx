"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CaretUpDown, Check, CookingPot, HandHeart, Plant, ShoppingBagOpen, Truck } from "@phosphor-icons/react/dist/ssr";
import { HOME } from "@/lib/navigation";
import type { MockRole } from "@/lib/types/api";
import { useApp } from "./AppState";
import { cn } from "@/lib/cn";

const ROLES: { id: MockRole; label: string; who: string; icon: typeof Plant }[] = [
  { id: "FARMER", label: "Farmer", who: "Hollins Farm · sells produce", icon: Plant },
  { id: "CUSTOMER", label: "Customer", who: "Amara · buys from farms", icon: ShoppingBagOpen },
  { id: "DRIVER", label: "Driver", who: "Sam · delivers orders", icon: Truck },
  { id: "ORGANISATION", label: "Food group", who: "St Mary's · claims food", icon: HandHeart },
  { id: "KITCHEN", label: "Kitchen", who: "Fishergate · cooks meals", icon: CookingPot },
];

/**
 * Demo only: look at FarmNomad as each kind of user. One compact row that opens a menu,
 * instead of a grid of every role. Replaced by real roles from login later.
 */
export function RoleSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { role, setRole, setMobileNav } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const current = ROLES.find((r) => r.id === role) ?? ROLES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    // Focus the current role so arrow keys start from it.
    requestAnimationFrame(() => items.current[ROLES.findIndex((r) => r.id === role)]?.focus());
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, role]);

  const pick = (r: MockRole) => {
    setOpen(false);
    if (r === role) return;
    setRole(r);
    setMobileNav(false);
    router.push(HOME[r]);
  };

  const onKey = (e: KeyboardEvent) => {
    const i = items.current.findIndex((el) => el === document.activeElement);
    if (e.key === "Escape") {
      setOpen(false);
      box.current?.querySelector<HTMLButtonElement>("[data-trigger]")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = (i + (e.key === "ArrowDown" ? 1 : -1) + ROLES.length) % ROLES.length;
      items.current[n]?.focus();
    }
  };

  return (
    <div ref={box} className="relative" onKeyDown={onKey}>
      <button
        data-trigger
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Viewing as ${current.label}. Switch demo view`}
        title={collapsed ? `Viewing as ${current.label}` : undefined}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-[9px] p-1.5 text-left transition-[background-color,box-shadow] duration-150",
          open ? "bg-app-hover shadow-[0_0_0_1px_var(--a-line)]" : "hover:bg-app-hover",
          collapsed && "justify-center",
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-app-accent-soft text-app-accent shadow-[inset_0_0_0_1px_var(--a-accent-soft)]">
          <current.icon weight="fill" className="size-4" />
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[10px] font-medium uppercase tracking-[0.06em] text-app-faint">Demo · viewing as</span>
              <span className="block truncate font-medium">{current.label}</span>
            </span>
            <CaretUpDown className="size-3.5 shrink-0 text-app-faint transition-colors group-hover:text-app-muted" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="View the demo as"
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute z-50 w-[248px] rounded-xl bg-app-panel p-1.5 shadow-pop",
              collapsed ? "bottom-0 left-full ml-2 origin-bottom-left" : "bottom-full left-0 mb-1.5 origin-bottom-left",
            )}
          >
            <p className="px-2 pb-1.5 pt-1 text-[11px] text-app-faint">See FarmNomad as…</p>
            {ROLES.map((r, i) => {
              const on = r.id === role;
              return (
                <button
                  key={r.id}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => pick(r.id)}
                  className={cn("flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left outline-none transition-colors hover:bg-app-hover focus-visible:bg-app-hover", on && "bg-app-active")}
                >
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-[7px]", on ? "bg-app-accent text-white dark:text-black" : "bg-app-hover text-app-muted")}>
                    <r.icon weight={on ? "fill" : "regular"} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block font-medium">{r.label}</span>
                    <span className="block truncate text-ui-sm text-app-faint">{r.who}</span>
                  </span>
                  {on && <Check weight="bold" className="size-3.5 shrink-0 text-app-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
