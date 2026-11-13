"use client";

import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { useApp } from "./AppState";
import { cn } from "@/lib/cn";

/**
 * One button: a moon in light mode, a sun in dark mode. It follows the computer's theme until it's
 * clicked; after that the choice is remembered on this device.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedDark, setTheme } = useApp();
  const label = resolvedDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-8 place-items-center overflow-hidden rounded-[7px] text-app-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-app-hover hover:text-app-text active:scale-[0.94]",
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={resolvedDark ? "sun" : "moon"}
          className="grid place-items-center"
          initial={{ opacity: 0, scale: 0.6, rotate: resolvedDark ? -90 : 90, filter: "blur(3px)" }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.6, rotate: resolvedDark ? 90 : -90, filter: "blur(3px)" }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          {resolvedDark ? <Sun weight="bold" className="size-[17px]" /> : <Moon weight="bold" className="size-[17px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
