"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./ui";

/**
 * Right-hand panel for create/edit/detail, like Linear's issue peek and Attio's record panel.
 * Slides in with the iOS drawer curve, Esc or the backdrop closes it, focus moves inside and returns after.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement;
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("input, select, textarea, button[data-autofocus]");
      (first ?? panel.current)?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey, true);
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  const root = document.querySelector(".fn-app") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            className="absolute inset-y-2 right-2 flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl bg-app-panel shadow-pop outline-none focus-visible:outline-none"
            style={{ width }}
            initial={{ transform: "translateX(calc(100% + 16px))" }}
            animate={{ transform: "translateX(0%)" }}
            exit={{ transform: "translateX(calc(100% + 16px))", transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-app-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
                {subtitle && <div className="mt-0.5 text-app-muted">{subtitle}</div>}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
                <X className="size-4" />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <footer className="flex items-center justify-end gap-2 border-t border-app-line px-5 py-3">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  );
}
