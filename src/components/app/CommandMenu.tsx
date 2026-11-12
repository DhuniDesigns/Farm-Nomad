"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Desktop, HandHeart, Moon, Plus, Sun, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useListMyProductsQuery } from "@/lib/api/farmnomad";
import { useApp } from "./AppState";
import { NAV } from "@/lib/navigation";
import { useListProductsQuery } from "@/lib/api/farmnomad";
import { Kbd, gbp } from "./ui";

/**
 * Raycast-style launcher. Opens with ⌘K / Ctrl K from anywhere.
 * No open animation delay on repeat use: it scales in from 0.98 in 150ms and closes faster.
 */
export function CommandMenu() {
  const { role, command, setCommand, setProductSheet, setSurplusSheet, setTheme } = useApp();
  const farmer = role === "FARMER";
  const router = useRouter();
  const { data: mine } = useListMyProductsQuery(undefined, { skip: !farmer });
  const { data: market } = useListProductsQuery(undefined, { skip: farmer });
  const products = farmer ? mine : market;

  const run = (fn: () => void) => {
    setCommand(false);
    // Let the menu close before the next layer opens.
    requestAnimationFrame(fn);
  };

  const item =
    "flex h-10 cursor-default select-none items-center gap-3 rounded-[8px] px-3 text-app-muted data-[selected=true]:bg-app-active data-[selected=true]:text-app-text";

  return (
    <AnimatePresence>
      {command && (
        <div className="fixed inset-0 z-[80] grid items-start justify-items-center px-4 pt-[14vh]">
          <motion.div
            className="absolute inset-0 bg-black/20 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            onClick={() => setCommand(false)}
          />
          <motion.div
            className="relative w-full max-w-[620px]"
            initial={{ opacity: 0, transform: "scale(0.98)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.98)", transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            <Command
              label="Command menu"
              loop
              className="overflow-hidden rounded-xl bg-app-panel shadow-pop"
              onKeyDown={(e) => e.key === "Escape" && setCommand(false)}
            >
              <Command.Input
                autoFocus
                placeholder={farmer ? "Search products, pages and actions" : "Search produce, farms and pages"}
                className="h-14 w-full border-b border-app-line bg-transparent px-5 text-[15px] text-app-text outline-none placeholder:text-app-faint"
              />
              <Command.List className="max-h-[min(420px,55vh)] overflow-y-auto overscroll-contain p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-ui-sm [&_[cmdk-group-heading]]:text-app-faint">
                <Command.Empty className="px-3 py-10 text-center text-app-muted">Nothing matches that. Try a product name.</Command.Empty>

                {farmer && <Command.Group heading="Actions">
                  <Command.Item className={item} onSelect={() => run(() => setProductSheet({ mode: "new" }))}>
                    <Plus className="size-4" /> New product <Kbd className="ml-auto">C</Kbd>
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => run(() => setSurplusSheet(true))}>
                    <HandHeart className="size-4" /> Flag surplus
                  </Command.Item>
                </Command.Group>}

                <Command.Group heading="Go to">
                  {NAV[role].map(({ href, label, icon: Icon, key }) => (
                    <Command.Item key={href} className={item} onSelect={() => run(() => router.push(href))}>
                      <Icon className="size-4" /> {label}
                      {key && (
                        <span className="ml-auto flex gap-1">
                          <Kbd>G</Kbd>
                          <Kbd>{key}</Kbd>
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                {!!products?.length && (
                  <Command.Group heading={farmer ? "Your products" : "Produce"}>
                    {products.map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`${p.id} ${p.name} ${p.farmerName ?? ""} ${p.category ?? ""} ${p.tags?.join(" ") ?? ""}`}
                        className={item}
                        onSelect={() =>
                          run(() => {
                            if (!farmer) return router.push(`/marketplace/${p.id}`);
                            router.push("/products");
                            setProductSheet({ mode: "edit", product: p });
                          })
                        }
                      >
                        <span className="grid size-6 place-items-center rounded-md bg-app-hover">
                          {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" width={40} height={40} className="size-5 object-contain" />}
                        </span>
                        <span className="text-app-text">{p.name}</span>
                        <span className="num ml-auto text-ui-sm">{gbp(p.price)}</span>
                        <ArrowRight className="size-3.5 opacity-0 [[data-selected=true]_&]:opacity-100" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Theme">
                  <Command.Item className={item} onSelect={() => run(() => setTheme("light"))}>
                    <Sun className="size-4" /> Light
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => run(() => setTheme("dark"))}>
                    <Moon className="size-4" /> Dark
                  </Command.Item>
                  <Command.Item className={item} onSelect={() => run(() => setTheme("system"))}>
                    <Desktop className="size-4" /> Match system
                  </Command.Item>
                </Command.Group>
              </Command.List>
              <div className="flex items-center gap-4 border-t border-app-line px-4 py-2.5 text-ui-sm text-app-faint">
                <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
                <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> to open</span>
                <span className="ml-auto flex items-center gap-1.5"><Kbd>esc</Kbd> to close</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
