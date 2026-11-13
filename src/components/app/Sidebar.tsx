"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowSquareOut, MagnifyingGlass, SidebarSimple } from "@phosphor-icons/react/dist/ssr";
import { useAssignedOrdersQuery, useGetCartQuery, useKitchenMealOrdersQuery, useMyMealsQuery, useListDonationsQuery, useListFarmerOrdersQuery, useListMyProductsQuery, useMeQuery, useMyMessagesQuery, useMyOrdersQuery, useUnassignedOrdersQuery } from "@/lib/api/farmnomad";
import { NAV, ROLE_META, SOON } from "@/lib/navigation";
import { stockState, type MockRole } from "@/lib/types/api";
import { cn } from "@/lib/cn";
import { useApp } from "./AppState";
import { RoleSwitcher } from "./RoleSwitcher";
import { Avatar, IconButton, Kbd } from "./ui";

/** Re-exported for older imports: the current role's nav. */
export { NAV };

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  const { role, collapsed: c, toggleCollapsed, setCommand, setMobileNav } = useApp();
  const collapsed = c && !mobile;
  const { data: me } = useMeQuery();
  const counts = useCounts(role);
  const items = NAV[role];

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-app-side transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        mobile ? "w-[280px]" : collapsed ? "w-[60px]" : "w-[240px]",
      )}
      aria-label="App"
    >
      {/* Workspace */}
      <div className={cn("flex h-12 items-center gap-1 px-2.5 pt-1", collapsed && "justify-center px-0")}>
        <div className={cn("flex min-w-0 items-center gap-2 rounded-[7px] p-1.5", collapsed ? "justify-center" : "flex-1")}>
          {collapsed || role === "FARMER" || role === "ORGANISATION" || role === "KITCHEN" ? (
            <Image src="/logo-mark.svg" alt="" width={20} height={20} className="size-5 shrink-0" />
          ) : (
            <>
              <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} className="h-[18px] w-auto dark:hidden" />
              <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} className="hidden h-[18px] w-auto dark:block" />
            </>
          )}
          {!collapsed && (
            <>
              {(role === "FARMER" || role === "ORGANISATION" || role === "KITCHEN") && <span className="truncate font-semibold tracking-[-0.01em]">{ROLE_META[role].workspace}</span>}
              {role !== "ORGANISATION" && role !== "KITCHEN" && <span className="ml-auto shrink-0 rounded-full bg-app-accent-soft px-1.5 text-[10px] font-semibold uppercase tracking-wide text-app-accent">{ROLE_META[role].label}</span>}
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
              <span>{role === "CUSTOMER" ? "Search produce" : "Search or jump to"}</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      <nav className="px-2.5" aria-label="Main">
        <ul className="grid gap-px">
          {items.map(({ href, label, icon: Icon }) => {
            const longer = items.some((n) => n.href !== href && n.href.startsWith(href + "/") && (path === n.href || path.startsWith(n.href + "/")));
            const active = !longer && (path === href || path.startsWith(href + "/") || (href === "/cart" && path.startsWith("/checkout")));
            const n = counts[href];
            const soon = SOON.has(href);
            return (
              <li key={href} className="relative">
                {active && (
                  <motion.span layoutId="side-active" className="absolute inset-0 rounded-[7px] bg-app-active" transition={{ type: "spring", duration: 0.35, bounce: 0 }} />
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
                  {!collapsed && soon && <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-app-faint">Soon</span>}
                  {!collapsed && !soon && !!n && <span className="num ml-auto rounded-full bg-app-hover px-1.5 text-ui-sm text-app-muted">{n}</span>}
                  {collapsed && !!n && <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-app-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto grid gap-1 px-2.5 pb-3">
        <RoleSwitcher collapsed={collapsed} />
        <Link
          href="/"
          className={cn("flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-app-muted transition-colors hover:bg-app-hover hover:text-app-text", collapsed && "justify-center px-0")}
          title={collapsed ? "FarmNomad website" : undefined}
        >
          <ArrowSquareOut className="size-[17px] shrink-0" />
          {!collapsed && "FarmNomad website"}
        </Link>
        {collapsed && (
          <IconButton label="Expand sidebar  [" onClick={toggleCollapsed} className="mx-auto">
            <SidebarSimple className="size-4" />
          </IconButton>
        )}
        <div className="mx-1 my-1 h-px bg-app-line" />
        <Link href="/profile" className={cn("mt-1 flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 transition-colors hover:bg-app-hover", collapsed && "justify-center px-0")}>
          <Avatar name={me?.fullName ?? "FarmNomad"} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{me?.fullName ?? " "}</p>
              <p className="truncate text-ui-sm text-app-faint">{me?.email ?? " "}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}

/** Badge counts per role: things that need the user's attention. */
export function useCounts(role: MockRole): Record<string, number | undefined> {
  const farmer = role === "FARMER";
  const customer = role === "CUSTOMER" || role === "KITCHEN";
  const kitchen = role === "KITCHEN";
  const driver = role === "DRIVER";
  const org = role === "ORGANISATION";
  const { data: fOrders } = useListFarmerOrdersQuery(undefined, { skip: !farmer });
  const { data: products } = useListMyProductsQuery(undefined, { skip: !farmer });
  const { data: cart } = useGetCartQuery(undefined, { skip: !customer });
  const { data: cOrders } = useMyOrdersQuery(undefined, { skip: !customer });
  const { data: mine } = useAssignedOrdersQuery(undefined, { skip: !driver });
  const { data: open } = useUnassignedOrdersQuery(undefined, { skip: !driver });
  const { data: donations } = useListDonationsQuery(undefined, { skip: !org });
  const { data: mealOrders } = useKitchenMealOrdersQuery(undefined, { skip: !kitchen });
  const { data: menu } = useMyMealsQuery(undefined, { skip: !kitchen });
  const { data: me } = useMeQuery();
  const { data: msgs } = useMyMessagesQuery();
  const unread = msgs?.filter((m) => !m.read && m.recipientId === me?.id).length;
  if (farmer)
    return {
      "/orders": fOrders?.filter((o) => o.status === "PENDING").length,
      "/products": products?.filter((p) => ["low", "expiring", "expired"].includes(stockState(p))).length,
      "/messages": unread,
    };
  if (driver)
    return {
      "/jobs": (mine?.filter((o) => o.status === "ASSIGNED" || o.status === "IN_TRANSIT").length ?? 0) + (open?.length ?? 0) || undefined,
      "/messages": unread,
    };
  if (org) return { "/donations": donations?.length, "/messages": unread };
  if (kitchen)
    return {
      "/meals/orders": mealOrders?.filter((o) => o.status === "NEW").length,
      "/meals": menu?.filter((m) => m.available && m.portionsAvailable <= 3).length,
      "/cart": cart?.reduce((s, i) => s + i.quantity, 0),
      "/messages": unread,
    };
  return {
    "/cart": cart?.reduce((s, i) => s + i.quantity, 0),
    "/orders": cOrders?.filter((o) => ["PENDING", "ASSIGNED", "IN_TRANSIT"].includes(o.status)).length,
    "/messages": unread,
  };
}
