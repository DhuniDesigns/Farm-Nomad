"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Bell, Check, HandHeart, List, Package, Receipt, ShoppingBagOpen } from "@phosphor-icons/react/dist/ssr";
import { useGetCartQuery, useMarkNotificationReadMutation, useMyNotificationsQuery } from "@/lib/api/farmnomad";
import { HOME, NAV, ROLE_META, allNav, canOpen } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import { AppState, useApp } from "./AppState";
import { CommandMenu } from "./CommandMenu";
import { ProductSheet } from "./ProductSheet";
import { Sidebar, useCounts } from "./Sidebar";
import { SurplusSheet } from "./SurplusSheet";
import { IconButton, relDay, time } from "./ui";
import { useShortcuts } from "./useShortcuts";

export function AppShell({ children }: { children: ReactNode }) {
  // Signed-in, per-user screens: render on the client only (no prerender of user data or clocks).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <div className="fn-app h-[100dvh]" aria-busy="true" />;
  return (
    <AppState>
      <Frame>{children}</Frame>
    </AppState>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { role, theme, resolvedDark, mobileNav, setMobileNav } = useApp();
  const path = usePathname();
  const router = useRouter();
  useShortcuts();

  useEffect(() => {
    setMobileNav(false);
  }, [path, setMobileNav]);

  // Keep each role on its own pages (stand-in for RoleGuard until real auth lands).
  const blocked = !canOpen(role, path);
  const tabs = role === "CUSTOMER" || role === "DRIVER";
  useEffect(() => {
    if (blocked) router.replace(HOME[role]);
  }, [blocked, role, router]);

  return (
    <div className="fn-app flex h-[100dvh] overflow-hidden" data-theme={theme === "system" ? undefined : theme}>
      <div className="hidden border-r border-app-line md:block">
        <Sidebar />
      </div>

      {/* Phone: sidebar as a drawer */}
      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 border-r border-app-line shadow-pop"
              initial={{ transform: "translateX(-100%)" }}
              animate={{ transform: "translateX(0%)" }}
              exit={{ transform: "translateX(-100%)", transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            >
              <Sidebar mobile />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className={cn("min-h-0 flex-1 overflow-y-auto", tabs && "pb-16 md:pb-0")}>{blocked ? null : children}</main>
        {tabs && <TabBar />}
      </div>

      <CommandMenu />
      <ProductSheet />
      <SurplusSheet />
      <SurplusSheet mode="donate" />
      <Toaster
        theme={resolvedDark ? "dark" : "light"}
        position="bottom-right"
        mobileOffset={{ bottom: tabs ? 76 : 16 }}
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-ui)", fontSize: 13, borderRadius: 10 } }}
      />
    </div>
  );
}

function TopBar() {
  const path = usePathname();
  const { role, setMobileNav } = useApp();
  const page = path.startsWith("/checkout")
    ? { label: "Checkout" }
    : (NAV[role].find((n) => path === n.href || path.startsWith(n.href + "/")) ?? allNav.find((n) => path === n.href || path.startsWith(n.href + "/")));
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-app-line px-3 md:px-5">
      <IconButton label="Open menu" className="md:hidden" onClick={() => setMobileNav(true)}>
        <List className="size-[18px]" />
      </IconButton>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-app-muted">
        <span className="hidden sm:inline">{ROLE_META[role].workspace}</span>
        <span className="hidden text-app-faint sm:inline">/</span>
        <span className="truncate font-medium text-app-text">{page?.label ?? "FarmNomad"}</span>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {role === "CUSTOMER" && <CartButton />}
        <Notifications />
      </div>
    </header>
  );
}

const nIcon = { ORDER_UPDATE: Receipt, SURPLUS_ALERT: HandHeart, DONATION_UPDATE: HandHeart, SYSTEM: Package } as const;

function Notifications() {
  const [open, setOpen] = useState(false);
  const { data = [] } = useMyNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const unread = data.filter((n) => !n.read).length;
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <IconButton label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Bell className="size-[18px]" />
        {!!unread && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-app-accent ring-2 ring-app-bg" />}
      </IconButton>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-10 z-50 w-[min(360px,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-xl bg-app-panel shadow-pop"
            initial={{ opacity: 0, transform: "scale(0.96) translateY(-4px)" }}
            animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
            exit={{ opacity: 0, transform: "scale(0.98)", transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between border-b border-app-line px-4 py-3">
              <p className="font-semibold">Notifications</p>
              {!!unread && (
                <button className="flex items-center gap-1 text-ui-sm text-app-muted hover:text-app-text" onClick={() => data.filter((n) => !n.read).forEach((n) => markRead(n.id))}>
                  <Check className="size-3.5" /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-[360px] overflow-y-auto p-1.5">
              {data.map((n) => {
                const Icon = nIcon[n.type];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => !n.read && markRead(n.id)}
                      className={cn("flex w-full gap-3 rounded-[8px] px-2.5 py-2.5 text-left transition-colors hover:bg-app-hover", n.read && "opacity-60")}
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-app-hover text-app-muted">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug">{n.message}</span>
                        <span className="num text-ui-sm text-app-faint">
                          {relDay(n.createdAt)}, {time(n.createdAt)}
                        </span>
                      </span>
                      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-app-accent" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CartButton() {
  const { data } = useGetCartQuery();
  const n = data?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  return (
    <Link
      href="/cart"
      aria-label={n ? `Cart, ${n} item${n === 1 ? "" : "s"}` : "Cart"}
      className="relative grid size-8 place-items-center rounded-[7px] text-app-muted transition-[background-color,color,transform] duration-150 hover:bg-app-hover hover:text-app-text active:scale-[0.94]"
    >
      <ShoppingBagOpen className="size-[18px]" />
      <AnimatePresence>
        {n > 0 && (
          <motion.span
            key={n}
            className="num absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-app-primary px-1 text-[10px] font-semibold text-app-on-primary"
            initial={{ transform: "scale(0.6)", opacity: 0 }}
            animate={{ transform: "scale(1)", opacity: 1 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.35 }}
          >
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

/** Customers and drivers are mobile-first (spec §6): bottom tabs on phones for the four things they do most. */
function TabBar() {
  const path = usePathname();
  const { role } = useApp();
  const counts = useCounts(role);
  const tabs = NAV[role].filter((n) => n.mobile);
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-app-line bg-app-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/") || (href === "/cart" && path.startsWith("/checkout"));
        const n = counts[href];
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors", active ? "text-app-text" : "text-app-faint")}>
            <span className="relative">
              <Icon weight={active ? "fill" : "regular"} className={cn("size-[22px]", active && "text-app-accent")} />
              {!!n && <span className="num absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-app-primary px-1 text-[9px] font-semibold text-app-on-primary">{n}</span>}
            </span>
            {label.replace("My orders", "Orders")}
          </Link>
        );
      })}
    </nav>
  );
}
