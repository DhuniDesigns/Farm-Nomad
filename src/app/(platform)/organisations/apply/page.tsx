"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Buildings, Check, Church, ForkKnife, GraduationCap, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { useCreateOrganisationMutation, useMockResetOrganisationMutation, useMockVerifyOrganisationMutation, useMyOrganisationQuery, useUpdateOrganisationMutation } from "@/lib/api/farmnomad";
import type { Organisation, OrganisationType } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Field, input } from "@/components/app/ProductSheet";
import { orgTypeLabel, verificationMeta } from "@/components/app/give/meta";
import { Button, Pill, Skeleton } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const TYPES: { id: OrganisationType; icon: typeof Buildings; body: string }[] = [
  { id: "FOODBANK", icon: ForkKnife, body: "Food parcels, pantries and community fridges" },
  { id: "SCHOOL", icon: GraduationCap, body: "Breakfast clubs and school kitchens" },
  { id: "RELIGIOUS", icon: Church, body: "Churches, mosques, gurdwaras and temples" },
  { id: "STUDENT_GROUP", icon: BookOpen, body: "Student unions and campus food projects" },
];

/** Spec §7.11 /organisations/apply: three-step application, or your status if you've already applied. */
export default function OrganisationPage() {
  const { data: org, isLoading, isError } = useMyOrganisationQuery();
  if (isLoading)
    return (
      <div className="mx-auto grid max-w-[720px] gap-4 px-4 py-9 md:px-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  return org && !isError ? <Status org={org} /> : <Apply />;
}

/* ─── Already applied: status + details ─── */

function Status({ org }: { org: Organisation }) {
  const [update, { isLoading }] = useUpdateOrganisationMutation();
  const [verify] = useMockVerifyOrganisationMutation();
  const [reset] = useMockResetOrganisationMutation();
  const [f, setF] = useState({ name: org.name, charityNumber: org.charityNumber ?? "", description: org.description ?? "" });
  useEffect(() => {
    setF({ name: org.name, charityNumber: org.charityNumber ?? "", description: org.description ?? "" });
  }, [org]);
  const level = org.verificationLevel ?? "UNVERIFIED";
  const v = verificationMeta[level];
  const steps = ["Applied", "Checking", "Verified"];
  const at = level === "VERIFIED" ? 2 : level === "PENDING" ? 1 : 0;
  const dirty = f.name !== org.name || f.charityNumber !== (org.charityNumber ?? "") || f.description !== (org.description ?? "");

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    try {
      await update({ id: org.id, ...f }).unwrap();
      toast.success("Organisation details saved");
    } catch {
      toast.error("Couldn't save those details");
    }
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <PageHeader title="Organisation" description="Your group's details and verification." />
      <div className="grid gap-4 px-4 md:px-8">
        <section className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]" aria-label="Verification">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-10 place-items-center rounded-xl", level === "VERIFIED" ? "bg-app-accent-soft text-app-accent" : "bg-app-hover text-app-muted")}>
                <SealCheck weight="fill" className="size-5" />
              </span>
              <div>
                <p className="font-medium">{v.label}</p>
                <p className="text-ui-sm text-app-muted">{v.body}</p>
              </div>
            </div>
            <Pill tone={v.tone}>{orgTypeLabel[org.type]}</Pill>
          </div>
          <ol className="mt-5 grid grid-cols-3 gap-1.5">
            {steps.map((s, i) => (
              <li key={s} className="grid gap-1.5">
                <span className={cn("h-1 rounded-full", i <= at ? "bg-app-accent" : "bg-app-hover")} />
                <span className={cn("text-[11px] font-medium", i <= at ? "text-app-text" : "text-app-faint")}>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <form onSubmit={save} className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Details">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Organisation name" required>
                <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input(!f.name.trim())} />
              </Field>
            </div>
            <Field label="Charity number" hint="Optional">
              <input value={f.charityNumber} onChange={(e) => setF({ ...f, charityNumber: e.target.value })} className={input(false)} inputMode="numeric" />
            </Field>
            <Field label="Type">
              <input value={orgTypeLabel[org.type]} readOnly disabled className={input(false) + " opacity-60"} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="What you do" hint="Shown to farms when you claim.">
                <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className={cn(input(false), "h-auto resize-none py-2")} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end border-t border-app-line px-5 py-3">
            <Button type="submit" variant="primary" disabled={!dirty || isLoading}>
              Save changes
            </Button>
          </div>
        </form>

        {/* Demo controls: in the real app an admin verifies from /admin/verifications. */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-app-line-strong p-4 text-ui-sm text-app-faint">
          <span className="mr-auto">Demo: try the flow from the start, or approve as an admin would.</span>
          {level !== "VERIFIED" && (
            <Button size="sm" onClick={() => verify()}>
              Approve
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => reset()}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Apply: three steps ─── */

function Apply() {
  const [create, { isLoading }] = useCreateOrganisationMutation();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<{ name: string; type: OrganisationType | ""; charityNumber: string; description: string }>({ name: "", type: "", charityNumber: "", description: "" });
  const [err, setErr] = useState<string | null>(null);

  function next() {
    setErr(null);
    if (step === 0 && (!f.name.trim() || !f.type)) return setErr(!f.name.trim() ? "Add your organisation's name." : "Pick the type of group.");
    setStep((s) => s + 1);
  }

  async function submit() {
    try {
      await create({ name: f.name.trim(), type: f.type as OrganisationType, charityNumber: f.charityNumber.trim() || undefined, description: f.description.trim() || undefined }).unwrap();
      toast.success("Application sent", { description: "We'll check your details, usually within two working days." });
    } catch (e) {
      setErr((e as { data?: { message?: string } })?.data?.message ?? "Couldn't send your application.");
    }
  }

  const slide = { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 }, transition: { duration: 0.2 } };

  return (
    <div className="mx-auto max-w-[640px] pb-16">
      <PageHeader title="Apply as a food group" description="Verified groups can claim donations and surplus from farms nearby." />
      <div className="px-4 md:px-8">
        <div className="mb-6 flex items-center gap-3">
          <ol className="grid flex-1 grid-cols-3 gap-1.5" aria-label="Progress">
            {[0, 1, 2].map((i) => (
              <li key={i} className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-app-accent" : "bg-app-hover")} />
            ))}
          </ol>
          <span className="num shrink-0 text-ui-sm text-app-faint">Step {step + 1} of 3</span>
        </div>

        <div className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div key="0" {...slide} className="grid gap-5">
                <Field label="Organisation name" required>
                  <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input(false)} placeholder="e.g. St Mary's Food Bank" autoFocus />
                </Field>
                <div className="grid gap-2" role="radiogroup" aria-label="Type of group">
                  <p className="font-medium">Type of group</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TYPES.map(({ id, icon: Icon, body }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={f.type === id}
                        onClick={() => setF({ ...f, type: id })}
                        className={cn("flex items-start gap-3 rounded-xl p-3 text-left transition-[box-shadow,background-color]", f.type === id ? "bg-app-accent-soft shadow-[inset_0_0_0_1.5px_var(--a-accent)]" : "shadow-[inset_0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover")}
                      >
                        <Icon weight="duotone" className={cn("mt-0.5 size-5 shrink-0", f.type === id ? "text-app-accent" : "text-app-muted")} />
                        <span>
                          <span className="block font-medium">{orgTypeLabel[id]}</span>
                          <span className="block text-ui-sm text-app-muted">{body}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="1" {...slide} className="grid gap-5">
                <Field label="Charity number" hint="Optional. Registered charities are verified faster.">
                  <input value={f.charityNumber} onChange={(e) => setF({ ...f, charityNumber: e.target.value })} className={input(false)} inputMode="numeric" placeholder="e.g. 1123456" autoFocus />
                </Field>
                <Field label="What you do" hint="Who you feed and how often. Farms see this when you claim.">
                  <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} className={cn(input(false), "h-auto resize-none py-2")} placeholder="e.g. Weekly food parcels for around 80 households in central Preston." />
                </Field>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="2" {...slide}>
                <p className="mb-4 font-medium">Check your details</p>
                <dl className="grid gap-3">
                  <Row k="Name" v={f.name} />
                  <Row k="Type" v={f.type ? orgTypeLabel[f.type] : ""} />
                  <Row k="Charity number" v={f.charityNumber || "Not given"} muted={!f.charityNumber} />
                  <Row k="What you do" v={f.description || "Not given"} muted={!f.description} />
                </dl>
                <p className="mt-5 text-ui-sm text-app-faint">We check every group before it can claim. You can browse donations while we do.</p>
              </motion.div>
            )}
          </AnimatePresence>
          {err && <p className="mt-4 text-ui-sm text-app-red">{err}</p>}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-app-line pt-4">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button variant="primary" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={submit} disabled={isLoading}>
                <Check weight="bold" className="size-3.5" /> Send application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
      <dt className="text-app-muted">{k}</dt>
      <dd className={cn(muted && "text-app-faint")}>{v}</dd>
    </div>
  );
}
