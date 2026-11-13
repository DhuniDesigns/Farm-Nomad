"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, CornersOut, X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/** Cut-out product shots sit on a tint; photos from the farm fill the frame. */
export const isCutout = (src: string) => /-cut\.\w+$/.test(src) || src.startsWith("blob:");

function Frame({ src, alt, sizes, priority, dim }: { src: string; alt: string; sizes: string; priority?: boolean; dim?: boolean }) {
  return isCutout(src) ? (
    <div className="absolute inset-0 grid place-items-center bg-[#F1F4EC] dark:bg-[#121912]">
      <Image src={src} alt={alt} width={900} height={900} sizes={sizes} priority={priority} unoptimized={src.startsWith("blob:")} className={cn("w-[78%] object-contain", dim && "opacity-40 grayscale")} />
    </div>
  ) : (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", dim && "opacity-40 grayscale")} />
  );
}

/** Main viewer + thumbnails for the top of the product page. */
export function Gallery({ images, name, dim, badge, onOpen }: { images: string[]; name: string; dim?: boolean; badge?: React.ReactNode; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  if (!n) return <div className="aspect-square rounded-3xl bg-app-hover" />;

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-3xl">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={images[i]}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            drag={n > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) go(info.offset.x < 0 ? 1 : -1);
            }}
          >
            <Frame src={images[i]} alt={`${name}, photo ${i + 1} of ${n}`} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} dim={dim} />
          </motion.div>
        </AnimatePresence>
        {badge}
        <button
          onClick={() => onOpen(i)}
          aria-label="View photos full screen"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <CornersOut weight="bold" className="size-4" />
        </button>
        {n > 1 && (
          <>
            <NavBtn side="left" onClick={() => go(-1)} />
            <NavBtn side="right" onClick={() => go(1)} />
            <span className="num absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-1 text-ui-sm font-medium text-white backdrop-blur-md">
              {i + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photos">
          {images.map((src, k) => (
            <button
              key={src + k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Photo ${k + 1}`}
              onClick={() => setI(k)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl transition-[box-shadow,opacity] duration-150",
                k === i ? "shadow-[0_0_0_2px_var(--a-accent)]" : "opacity-70 shadow-[0_0_0_1px_var(--a-line)] hover:opacity-100",
              )}
            >
              <Frame src={src} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBtn({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? CaretLeft : CaretRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#10251B] shadow-[0_2px_8px_rgb(0_0_0/0.15)] opacity-0 transition-[opacity,transform] duration-150 active:scale-95 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:hidden",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon weight="bold" className="size-4" />
    </button>
  );
}

/** "All photos" section: every photo of the product in a bento grid. */
export function PhotoGrid({ images, name, onOpen }: { images: string[]; name: string; onOpen: (i: number) => void }) {
  if (images.length < 2) return null;
  return (
    <section className="mx-auto mt-16 max-w-[1100px] px-4 md:px-8" aria-labelledby="photos-title">
      <div className="flex items-baseline justify-between">
        <h2 id="photos-title" className="font-display text-[22px] font-medium tracking-[-0.02em]">
          All photos <span className="num text-app-faint">{images.length}</span>
        </h2>
        <button onClick={() => onOpen(0)} className="text-ui-sm font-medium text-app-accent hover:underline">
          View full screen
        </button>
      </div>
      <div className="mt-5 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
        {images.map((src, k) => (
          <button
            key={src + k}
            onClick={() => onOpen(k)}
            aria-label={`Open photo ${k + 1} of ${name}`}
            className={cn(
              "group relative overflow-hidden rounded-2xl shadow-[0_0_0_1px_var(--a-line)] transition-transform duration-200 ease-out active:scale-[0.99]",
              k === 0 && "col-span-2 row-span-2",
            )}
          >
            <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
              <Frame src={src} alt="" sizes={k === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Full-screen photo viewer: arrows, swipe, ← → and Esc. */
export function Lightbox({ images, index, name, onClose }: { images: string[]; index: number | null; name: string; onClose: () => void }) {
  const [i, setI] = useState(index ?? 0);
  const n = images.length;
  useEffect(() => {
    if (index !== null) setI(index);
  }, [index]);
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [index, go, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Photos of ${name}`}
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <p className="text-[14px] font-medium">
              {name} <span className="num ml-2 text-white/50">{i + 1} / {n}</span>
            </p>
            <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
              <X weight="bold" className="size-4" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1" onClick={onClose}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={images[i]}
                className="absolute inset-4 md:inset-x-20"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                drag={n > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) go(info.offset.x < 0 ? 1 : -1);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={images[i]} alt={`${name}, photo ${i + 1}`} fill sizes="100vw" unoptimized={images[i].startsWith("blob:")} className="object-contain" />
              </motion.div>
            </AnimatePresence>
            {n > 1 && (
              <>
                <button onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="Previous photo" className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid">
                  <CaretLeft weight="bold" className="size-5" />
                </button>
                <button onClick={(e) => (e.stopPropagation(), go(1))} aria-label="Next photo" className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid">
                  <CaretRight weight="bold" className="size-5" />
                </button>
              </>
            )}
          </div>
          {n > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-5 py-4">
              {images.map((src, k) => (
                <button
                  key={src + k}
                  onClick={() => setI(k)}
                  aria-label={`Photo ${k + 1}`}
                  className={cn("relative size-14 shrink-0 overflow-hidden rounded-lg transition-opacity", k === i ? "opacity-100 ring-2 ring-white" : "opacity-45 hover:opacity-80")}
                >
                  <Image src={src} alt="" fill sizes="56px" unoptimized={src.startsWith("blob:")} className={isCutout(src) ? "bg-[#1a221b] object-contain p-1" : "object-cover"} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
