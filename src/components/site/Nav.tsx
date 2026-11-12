"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { Button, Logo } from "@/components/ui";
import { cn } from "@/lib/cn";

const links = [
  ["Shop", "shop"],
  ["How it works", "how"],
  ["Food groups", "surplus"],
  ["For farmers", "farmers"],
] as const;

const ease = [0.23, 1, 0.32, 1] as const;

/**
 * Full-width bar, Farmrow style.
 * - Hides while you read downwards, returns as soon as you scroll up.
 * - A soft pill follows the pointer between links (hover devices only).
 * - The link for the section you're in stays marked.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (y > 400 && y > prev + 6) setHidden(true);
    else if (y < prev - 6 || y < 400) setHidden(false);
  });

  // Mark the section in view
  useEffect(() => {
    const els = links.map(([, id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300",
          scrolled || open ? "border-line bg-canvas/85 backdrop-blur-xl" : "border-transparent bg-canvas",
        )}
        initial={false}
        animate={{ transform: hidden && !open ? "translateY(-100%)" : "translateY(0%)" }}
        transition={{ duration: reduce ? 0 : 0.4, ease }}
      >
        <nav aria-label="Main" className="gutter">
          <div className="wrap grid h-[76px] grid-cols-[1fr_auto] items-center gap-6 lg:h-20 lg:grid-cols-[1fr_auto_1fr]">
            <a href="#top" aria-label="FarmNomad home" className="justify-self-start rounded-md">
              <Logo />
            </a>

            <ul className="hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
              {links.map(([label, id]) => {
                const active = current === id;
                return (
                  <li key={id} className="relative">
                    <a
                      href={`#${id}`}
                      onMouseEnter={() => setHovered(id)}
                      aria-current={active ? "location" : undefined}
                      className={cn(
                        "relative z-10 inline-flex min-h-11 items-center px-4 text-small font-medium transition-colors duration-200",
                        active || hovered === id ? "text-ink" : "text-ink/65",
                      )}
                    >
                      {label}
                      {active && (
                        <motion.span
                          layoutId="nav-current"
                          aria-hidden
                          className="absolute bottom-1 left-1/2 -ml-0.5 size-1 rounded-full bg-moss dark:bg-accent"
                          transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                        />
                      )}
                    </a>
                    <AnimatePresence>
                      {hovered === id && (
                        <motion.span
                          layoutId="nav-hover"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-sunken [@media(hover:none)]:hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2 justify-self-end">
              <Button href="#join" className="hidden min-h-11 pl-5 pr-[1.375rem] text-small sm:inline-flex">
                Join the waitlist
              </Button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="relative grid size-11 place-items-center rounded-full bg-sunken transition-transform duration-150 ease-out active:scale-[0.94] lg:hidden"
              >
                <span aria-hidden className="relative block h-3 w-[18px]">
                  <span className={cn("absolute left-0 h-[1.5px] w-full rounded-full bg-ink transition-[transform,top] duration-300 ease-[var(--ease-out)]", open ? "top-[5px] rotate-45" : "top-0")} />
                  <span className={cn("absolute left-0 h-[1.5px] w-full rounded-full bg-ink transition-[transform,top] duration-300 ease-[var(--ease-out)]", open ? "top-[5px] -rotate-45" : "top-[10px]")} />
                </span>
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="gutter fixed inset-0 z-40 flex flex-col bg-canvas pb-6 pt-[92px] lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.3, ease: [0.77, 0, 0.175, 1] } }}
            transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
          >
            <ul className="grid">
              {links.map(([label, id], i) => (
                <motion.li
                  key={id}
                  className="border-b border-line"
                  initial={{ opacity: 0, transform: "translateY(16px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{ duration: 0.45, ease, delay: 0.15 + i * 0.05 }}
                >
                  <a href={`#${id}`} onClick={() => setOpen(false)} className="flex min-h-[72px] items-center justify-between font-display text-[2.25rem] font-medium tracking-[-0.04em]">
                    {label}
                    <span className="font-mono text-label text-muted">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div className="mt-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <p className="mb-4 text-small text-muted">Launching across the North West, rolling out UK-wide.</p>
              <Button href="#join" onClick={() => setOpen(false)} className="w-full">
                Join the waitlist
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
