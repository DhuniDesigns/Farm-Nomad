"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useApp } from "./AppState";
import { NAV } from "./Sidebar";

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
};

/**
 * Linear-style keys. ⌘K / Ctrl K opens the menu, C creates a product, [ toggles the sidebar,
 * G then D/P/O/S jumps between pages. Never animated, never fired while typing.
 */
export function useShortcuts() {
  const router = useRouter();
  const { setCommand, command, setProductSheet, toggleCollapsed, productSheet, surplusSheet } = useApp();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand(!command);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || command || productSheet || surplusSheet) return;
      const k = e.key.toLowerCase();

      if (pendingG.current) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const dest = NAV.find((n) => n.key.toLowerCase() === k);
        if (dest) {
          e.preventDefault();
          router.push(dest.href);
        }
        return;
      }
      if (k === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 900);
        return;
      }
      if (k === "c") {
        e.preventDefault();
        setProductSheet({ mode: "new" });
      }
      if (k === "[") toggleCollapsed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, setCommand, command, setProductSheet, toggleCollapsed, productSheet, surplusSheet]);
}
