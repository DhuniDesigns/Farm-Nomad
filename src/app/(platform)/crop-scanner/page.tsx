"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClockCounterClockwise, Scan, Warning } from "@phosphor-icons/react/dist/ssr";
import { confidencePct, useDeleteCropScanMutation, useDiagnoseMutation, useMyCropScansQuery, useUploadImageMutation } from "@/lib/api/cropScan.api";
import type { CropScan } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { DiagnosisResult, DiagnosisSkeleton, severityMeta } from "@/components/app/farm-tools/DiagnosisResult";
import { ImageUploadZone, type ScanPhase } from "@/components/app/farm-tools/ImageUploadZone";
import { Button, Skeleton, relDay } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const msg = (e: unknown, fallback: string) => (e as { data?: { message?: string } })?.data?.message ?? fallback;

/**
 * Crop scanner (spec §7.14, FARMER). Upload → URL (POST /uploads) → diagnose (POST /crop-scans/diagnose,
 * the backend calls farmnomad-ai and saves the result) → history (GET /crop-scans/my).
 */
export default function CropScannerPage() {
  const { data: history, isLoading } = useMyCropScansQuery();
  const [upload] = useUploadImageMutation();
  const [diagnose] = useDiagnoseMutation();
  const [remove, { isLoading: deleting }] = useDeleteCropScanMutation();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [current, setCurrent] = useState<CropScan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Free the local preview URL when it's replaced.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const run = useCallback(
    async (file: File) => {
      setError(null);
      setCurrent(null);
      setPreview(URL.createObjectURL(file));
      let stage: ScanPhase = "uploading";
      try {
        setPhase(stage);
        const { url } = await upload(file).unwrap();
        stage = "analysing";
        setPhase(stage);
        const scan = await diagnose({ imageUrl: url }).unwrap();
        setCurrent(scan);
        setPhase("done");
      } catch (e) {
        setError(msg(e, stage === "uploading" ? "The photo didn't upload. Check your connection and try again." : "We couldn't check that photo. Try again in a moment."));
        setPhase("error");
      }
    },
    [upload, diagnose],
  );

  const reset = () => {
    setPhase("idle");
    setPreview(null);
    setCurrent(null);
    setError(null);
  };

  const open = (s: CropScan) => {
    setCurrent(s);
    setPreview(s.imageUrl);
    setPhase("done");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function del(s: CropScan) {
    try {
      await remove(s.id).unwrap();
      toast("Scan deleted");
      if (current?.id === s.id) reset();
    } catch {
      toast.error("Couldn't delete that scan");
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader title="Crop scanner" description="Photograph a leaf to check it for disease, and get what to do next." />
      <div className="grid gap-10 px-4 md:px-8">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
          <ImageUploadZone preview={preview} phase={phase} onFile={run} onReset={reset} />

          <div className="md:pt-1" aria-live="polite">
            {phase === "uploading" || phase === "analysing" ? (
              <DiagnosisSkeleton />
            ) : phase === "error" ? (
              <div className="rounded-xl bg-app-red-soft p-5 text-app-red">
                <p className="flex items-center gap-2 font-medium">
                  <Warning weight="fill" className="size-4" /> Something went wrong
                </p>
                <p className="mt-1 text-ui-sm">{error}</p>
                <Button className="mt-4" onClick={reset}>
                  Try again
                </Button>
              </div>
            ) : current ? (
              <DiagnosisResult scan={current} deleting={deleting} onDelete={() => del(current)} />
            ) : (
              <div className="grid gap-4 rounded-2xl bg-app-hover/50 p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-app-panel text-app-accent shadow-[0_0_0_1px_var(--a-line)]">
                  <Scan weight="duotone" className="size-5" />
                </span>
                <div>
                  <p className="font-medium">How it works</p>
                  <ol className="mt-2 grid gap-1.5 text-app-muted">
                    <li>1. Take a clear photo of one affected leaf.</li>
                    <li>2. Our model compares it with thousands of labelled leaf photos.</li>
                    <li>3. You get the likely problem, how sure we are, and what to do.</li>
                  </ol>
                </div>
                <p className="text-ui-sm text-app-faint">Works best for tomatoes, potatoes, peppers, apples, grapes, strawberries, maize and other common crops.</p>
              </div>
            )}
          </div>
        </div>

        <section aria-labelledby="history">
          <h2 id="history" className="mb-3 flex items-center gap-2 font-medium">
            <ClockCounterClockwise className="size-4 text-app-faint" /> Past scans <span className="num text-app-faint">{history?.length ?? ""}</span>
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : !history?.length ? (
            <p className="rounded-xl p-5 text-app-faint shadow-[0_0_0_1px_var(--a-line)]">Your scans are saved here so you can track a problem over time.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {history.map((s) => {
                const healthy = s.healthy ?? /healthy/i.test(s.diagnosis);
                const sev = severityMeta[s.severity ?? (healthy ? "NONE" : "MODERATE")];
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => open(s)}
                      className={cn(
                        "group block w-full overflow-hidden rounded-xl text-left shadow-[0_0_0_1px_var(--a-line)] transition-shadow hover:shadow-[0_0_0_1px_var(--a-line-strong),0_8px_20px_-12px_rgb(0_0_0/0.2)]",
                        current?.id === s.id && "shadow-[0_0_0_2px_var(--a-accent)]",
                      )}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element -- hosted scan photos of any size */}
                        <img src={s.imageUrl} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      </div>
                      <div className="p-3">
                        <p className="truncate font-medium">{healthy ? "Healthy" : s.diagnosis}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-ui-sm text-app-faint">
                          <span className={cn("size-1.5 rounded-full", { green: "bg-app-accent", blue: "bg-app-blue", amber: "bg-app-amber", red: "bg-app-red", neutral: "bg-app-faint" }[sev.tone])} />
                          {s.crop ? `${s.crop} · ` : ""}
                          <span className="num">{confidencePct(s.confidence)}%</span> · {relDay(s.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
