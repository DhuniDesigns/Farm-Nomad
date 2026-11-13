"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";
import type { MockRole, Product } from "@/lib/types/api";
import { api } from "@/lib/api/farmnomad";

export type Theme = "system" | "light" | "dark";
type ProductSheet = { mode: "new" } | { mode: "edit"; product: Product } | null;

type Ctx = {
  role: MockRole;
  setRole: (r: MockRole) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedDark: boolean;
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileNav: boolean;
  setMobileNav: (v: boolean) => void;
  command: boolean;
  setCommand: (v: boolean) => void;
  productSheet: ProductSheet;
  setProductSheet: (s: ProductSheet) => void;
  surplusSheet: boolean;
  setSurplusSheet: (v: boolean) => void;
  /** Donate sheet: null closed, {} open, {productId} open with that product picked. */
  donateSheet: { productId?: number } | null;
  setDonateSheet: (v: { productId?: number } | null) => void;
};

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppState");
  return c;
};

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = window.localStorage.getItem(k);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function AppState({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();

  const [theme, setThemeState] = useState<Theme>("system");
  const [role, setRoleState] = useState<MockRole>(() => {
    const r = read<string>("fn_role", "FARMER");
    return (["FARMER", "CUSTOMER", "DRIVER", "ORGANISATION", "KITCHEN"].includes(r) ? r : "FARMER") as MockRole;
  });
  const [systemDark, setSystemDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [command, setCommand] = useState(false);
  const [productSheet, setProductSheet] = useState<ProductSheet>(null);
  const [surplusSheet, setSurplusSheet] = useState(false);
  const [donateSheet, setDonateSheet] = useState<{ productId?: number } | null>(null);

  useEffect(() => {
    setThemeState(read<Theme>("fn_theme", "system"));
    setCollapsed(read("fn_sidebar_collapsed", false));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    write("fn_theme", t);
  }, []);
  const setRole = useCallback((r: MockRole) => {
    write("fn_role", r);
    setRoleState(r);
    // Different user, different data: drop everything cached for the previous role.
    storeRef.current?.dispatch(api.util.resetApiState());
  }, []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      write("fn_sidebar_collapsed", !c);
      return !c;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      role,
      setRole,
      theme,
      setTheme,
      resolvedDark: theme === "dark" || (theme === "system" && systemDark),
      collapsed,
      toggleCollapsed,
      mobileNav,
      setMobileNav,
      command,
      setCommand,
      productSheet,
      setProductSheet,
      surplusSheet,
      setSurplusSheet,
      donateSheet,
      setDonateSheet,
    }),
    [role, setRole, theme, setTheme, systemDark, collapsed, toggleCollapsed, mobileNav, command, productSheet, surplusSheet, donateSheet],
  );

  return (
    <Provider store={storeRef.current}>
      <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
    </Provider>
  );
}
