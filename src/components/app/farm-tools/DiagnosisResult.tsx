"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CheckCircle, FirstAid, Info, Leaf, ShieldCheck, Trash, Warning } from "@phosphor-icons/react/dist/ssr";
import { confidencePct } from "@/lib/api/cropScan.api";
import type { CropScan, ScanSeverity } from "@/lib/types/api";
import { Button, Pill, Skeleton, relDay, time, type Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export const severityMeta: Record<ScanSeverity, { label: string; tone: Tone; hint: string }> = {
  NONE: { label: "Healthy", tone: "green", hint: "No disease found" },
  LOW: { label: "Mild", tone: "blue", hint: "Keep an eye on it" },
  MODERATE: { label: "Moderate", tone: "amber", hint: "Treat this week" },
  HIGH: { label: "Severe", tone: "red", hint: "Act today, it can spread" },
};

const LOW_CONFIDENCE = 60;

/** The answer: what it is, how sure the model is, how bad, and what to do. */
export function DiagnosisResult({ scan, onDelete, deleting }: { scan: CropScan; onDelete?: () => void; deleting?: boolean }) {
  const pct = confidencePct(scan.confidence);
  const healthy = scan.healthy ?? /healthy/i.test(scan.diagnosis);
  const sev = severityMeta[scan.severity ?? (healthy ? "NONE" : "MODERATE")];
  const sure = pct >= 80 ? "Very likely" : pct >= LOW_CONFIDENCE ? "Likely" : "Not sure";
  const treatment = scan.treatment ?? [];
  const prevention = scan.prevention ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {scan.crop && <span className="text-app-muted">{scan.crop}</span>}
          <Pill tone={sev.tone}>{sev.label}</Pill>
        </div>
        <h2 className="mt-1 flex items-center gap-2 font-display text-[28px] font-medium leading-tight tracking-[-0.03em]">
          {healthy && <CheckCircle weight="fill" className="size-7 shrink-0 text-app-accent" />}
          {healthy ? "Looks healthy" : scan.diagnosis}
        </h2>
        <p className="mt-0.5 text-app-muted">{sev.hint}</p>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex items-baseline justify-between text-ui-sm">
          <span className="text-app-muted">Confidence</span>
          <span>
            <span className="font-medium">{sure}</span> · <span className="num">{pct}%</span>
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-app-hover" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Confidence">
          <motion.div
            className={cn("h-full rounded-full", pct >= LOW_CONFIDENCE ? "bg-app-accent" : "bg-app-amber")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          />
        </div>
        {pct < LOW_CONFIDENCE && (
          <p className="mt-2.5 flex gap-2 rounded-lg bg-app-amber-soft p-3 text-ui-sm text-app-amber">
            <Warning weight="fill" className="mt-0.5 size-4 shrink-0" />
            <span>The model isn&apos;t sure. Retake it in daylight with one leaf filling the frame before acting on this.</span>
          </p>
        )}
      </div>

      {treatment.length > 0 && (
        <Section icon={<FirstAid weight="duotone" className="size-4" />} title="What to do now">
          <ol className="grid gap-2">
            {treatment.map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="num mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-app-hover text-[11px] font-semibold text-app-muted">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {prevention.length > 0 && (
        <Section icon={<ShieldCheck weight="duotone" className="size-4" />} title={healthy ? "Keep it that way" : "Stop it coming back"}>
          <ul className="grid gap-2">
            {prevention.map((t) => (
              <li key={t} className="flex gap-3">
                <Leaf weight="fill" className="mt-1 size-3.5 shrink-0 text-app-accent" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {!treatment.length && !prevention.length && scan.recommendation && <Section icon={<FirstAid weight="duotone" className="size-4" />} title="What to do">{scan.recommendation}</Section>}

      <p className="flex gap-2 text-ui-sm text-app-faint">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>A guide from a photo, not a lab test. If it&apos;s spreading fast or affects a whole crop, talk to an agronomist.</span>
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-app-line pt-4 text-ui-sm text-app-faint">
        <span>
          Saved {relDay(scan.createdAt).toLowerCase()} at {time(scan.createdAt)}
        </span>
        {onDelete && (
          <Button variant="ghost" size="sm" disabled={deleting} onClick={onDelete}>
            <Trash className="size-4" /> Delete scan
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <span className="text-app-accent">{icon}</span> {title}
      </h3>
      {children}
    </section>
  );
}

export function DiagnosisSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
