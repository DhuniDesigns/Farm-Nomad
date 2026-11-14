"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageSquare, Leaf, Sun, Target } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export type ScanPhase = "idle" | "uploading" | "analysing" | "done" | "error";

/**
 * Drop, choose, paste, or (on phones) take a photo of a leaf. While the photo uploads and the
 * model runs, a scan line sweeps the image so the wait reads as work, not a freeze.
 */
export function ImageUploadZone({ preview, phase, onFile, onReset }: { preview: string | null; phase: ScanPhase; onFile: (f: File) => void; onReset: () => void }) {
  const pick = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const busy = phase === "uploading" || phase === "analysing";

  // Paste a photo from the clipboard (desktop).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (busy) return;
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
      if (f) onFile(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy, onFile]);

  const take = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) take(e.dataTransfer.files);
        }}
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-2xl transition-[box-shadow,background-color] duration-150",
          preview ? "bg-black" : "bg-app-hover/60",
          over ? "shadow-[inset_0_0_0_2px_var(--a-accent)] bg-app-accent-soft" : preview ? "shadow-[0_0_0_1px_var(--a-line)]" : "shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]",
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview or hosted URL of any size */}
            <img src={preview} alt="Your crop photo" className="absolute inset-0 size-full object-contain" />
            <AnimatePresence>
              {busy && (
                <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/35" />
                  <motion.div
                    aria-hidden
                    className="absolute inset-x-0 h-24 bg-[linear-gradient(180deg,transparent,rgb(185_230_111/0.35)_85%,#B9E66F)] motion-reduce:hidden"
                    initial={{ top: "-25%" }}
                    animate={{ top: ["-25%", "100%"] }}
                    transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
                  />
                  <p className="absolute inset-x-0 bottom-4 text-center text-[14px] font-medium text-white" role="status">
                    {phase === "uploading" ? "Uploading photo…" : "Checking the leaf…"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="grid justify-items-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-app-panel text-app-accent shadow-[0_0_0_1px_var(--a-line)]">
                <Leaf weight="duotone" className="size-6" />
              </span>
              <p className="mt-4 font-medium">Drop a photo of the leaf here</p>
              <p className="mt-1 text-ui-sm text-app-faint">or paste one, or use the buttons below</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {preview && !busy ? (
          <Button onClick={onReset}>Scan another</Button>
        ) : (
          <>
            {/* Phones open the camera; desktops fall back to a file picker. */}
            <Button variant="primary" disabled={busy} onClick={() => cam.current?.click()} className="md:hidden">
              <Camera className="size-4" /> Take a photo
            </Button>
            <Button variant={preview ? "secondary" : "primary"} disabled={busy} onClick={() => pick.current?.click()} className="max-md:hidden">
              <ImageSquare className="size-4" /> Choose a photo
            </Button>
            <Button disabled={busy} onClick={() => pick.current?.click()} className="md:hidden">
              <ImageSquare className="size-4" /> From library
            </Button>
          </>
        )}
        <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
      </div>

      {!preview && (
        <ul className="mt-4 grid gap-2 text-ui-sm text-app-muted sm:grid-cols-3" aria-label="Tips for a good photo">
          <Tip icon={<Target className="size-4" />}>One leaf filling the frame</Tip>
          <Tip icon={<Sun className="size-4" />}>Daylight, no flash</Tip>
          <Tip icon={<Leaf className="size-4" />}>Show the marks clearly</Tip>
        </ul>
      )}
    </div>
  );
}

function Tip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-lg px-2.5 py-2 shadow-[0_0_0_1px_var(--a-line)]">
      <span className="text-app-accent">{icon}</span>
      {children}
    </li>
  );
}
