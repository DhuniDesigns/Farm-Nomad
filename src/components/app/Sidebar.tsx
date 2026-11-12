"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowSquareOut,
  Desktop,
  HandHeart,
  House,
  MagnifyingGlass,
  Moon,
  Package,
  Receipt,
  SidebarSimple,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import { useListFarmerOrdersQuery, useListMyProductsQuery, useMeQuery } from "@/lib/api/farmnomad";
import { stockState } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { useApp, type Theme } from "./AppState";
import { Avatar, IconButton, Kbd } from "./ui";

export const NAV = [
  { href: "/dashboard/farmer", label: "Dashboard", icon: House, key: "D" },
  { href: "/products", label: "Products", icon: Package, key: "P" },
  { href: "/orders", label: "Orders", icon: Receipt, key: "O" },
  { href: "/surplus/manage", label: "Surplus", icon: HandHeart, key: "S" },
] as const;

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  const { collapsed: c, toggleCollapsed, setCommand, setMobileNav } = useApp();
  const collapsed = c && !mobile;
  const { data: orders } = useListFarmerOrdersQuery();
  const { data: products } = useListMyProductsQuery();
  const { data: me } = useMeQuery();

  const counts: Record<string, number | undefined> = {
    "/orders": orders?.filter((o) => o.status === "PENDING").length,
    "/products": products?.filter((p) => ["low", "expiring", "expired"].includes(stockState(p))).length,
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-app-side transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        mobile ? "w-[280px]" : collapsed ? "w-[60px]" : "w-[240px]",
      )}
      aria-label="App"
    >
      {/* Farm switcher */}
      <div className={cn("flex h-12 items-center gap-1 px-2.5 pt-1", collapsed && "justify-center px-0")}>
        <div className={cn("flex min-w-0 items-center gap-2 rounded-[7px] p-1.5", collapsed ? "justify-center" : "flex-1")}>
          <Image src="/logo-mark.svg" alt="" width={20} height={20} className="size-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate font-semibold tracking-[-0.01em]">Hollins Farm</span>
              <span className="ml-auto rounded-full bg-app-accent-soft px-1.5 text-[10px] font-semibold uppercase tracking-wide text-app-accent">Farmer</span>
            </>
          )}
        </div>
        {!collapsed && !mobile && (
          <IconButton label="Collapse sidebar  [" onClick={toggleCollapsed} className="size-7">
            <SidebarSimple className="size-4" />
          </IconButton>
        )}
      </div>

      {/* Search */}
      <div className={cn("px-2.5 pb-2 pt-1", collapsed && "px-2")}>
        <button
          onClick={() => {
            setMobileNav(false);
            setCommand(true);
          }}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-[7px] bg-app-panel px-2 text-app-faint shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:text-app-muted",
            collapsed && "justify-center px-0",
          )}
          aria-label="Search or jump to"
        >
          <MagnifyingGlass className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span>Search or jump to</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      <nav className="px-2.5" aria-label="Main">
        <ul className="grid gap-px">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            const n = counts[href];
            return (
              <li key={href} className="relative">
                {active && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 rounded-[7px] bg-app-active"
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                  />
                )}
                <Link
                  href={href}
                  onClick={() => setMobileNav(false)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "relative flex h-8 items-center gap-2.5 rounded-[7px] px-2 transition-colors duration-150",
                    active ? "font-medium text-app-text" : "text-app-muted hover:bg-app-hover hover:text-app-text",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon weight={active ? "fill" : "regular"} className={cn("size-[17px] shrink-0", active && "text-app-accent")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {!collapsed && !!n && (
                    <span className="num ml-auto rounded-full bg-app-hover px-1.5 text-ui-sm text-app-muted">{n}</span>
                  )}
                  {collapsed && !!n && <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-app-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto grid gap-1 px-2.5 pb-3">
        <Link
          href="/"
          className={cn("flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-app-muted transition-colors hover:bg-app-hover hover:text-app-text", collapsed && "justify-center px-0")}
          title={collapsed ? "FarmNomad website" : undefined}
        >
          <ArrowSquareOut className="size-[17px] shrink-0" />
          {!collapsed && "FarmNomad website"}
        </Link>
        {!collapsed ? <ThemeSwitch /> : <IconButton label="Expand sidebar  [" onClick={toggleCollapsed} className="mx-auto"><SidebarSimple className="size-4" /></IconButton>}
        <div className={cn("mt-1 flex items-center gap-2.5 rounded-[7px] px-2 py-1.5", collapsed && "justify-center px-0")}>
          <Avatar name={me?.fullName ?? "Tom Hollins"} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{me?.fullName ?? " "}</p>
              <p className="truncate text-ui-sm text-app-faint">{me?.email ?? " "}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function ThemeSwitch() {
  const { theme, setTheme } = useApp();
  const opts: [Theme, typeof Sun, string][] = [
    ["system", Desktop, "System theme"],
    ["light", Sun, "Light theme"],
    ["dark", Moon, "Dark theme"],
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="relative grid h-8 grid-cols-3 rounded-[7px] bg-app-hover p-0.5">
      {opts.map(([t, Icon, label]) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          aria-label={label}
          title={label}
          onClick={() => setTheme(t)}
          className={cn("relative grid place-items-center rounded-[5px] transition-colors", theme === t ? "text-app-text" : "text-app-faint hover:text-app-muted")}
        >
          {theme === t && (
            <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-[5px] bg-app-panel shadow-[0_0_0_1px_var(--a-line),0_1px_2px_rgb(0_0_0/0.06)]" transition={{ type: "spring", duration: 0.3, bounce: 0 }} />
          )}
          <Icon className="relative size-3.5" />
        </button>
      ))}
    </div>
  );
}
