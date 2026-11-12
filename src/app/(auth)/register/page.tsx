"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CookingPot, EnvelopeSimple, HandHeart, Plant, ShoppingBagOpen, Truck } from "@phosphor-icons/react/dist/ssr";
import { useRegisterMutation } from "@/lib/api/farmnomad";
import { HOME } from "@/lib/navigation";
import type { Role } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { Field, input } from "@/components/app/ProductSheet";
import { Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";

// Spec §7.2 /register/role-select: the five roles you can sign up as (never ADMIN).
const ROLES: { id: Exclude<Role, "ADMIN">; label: string; body: string; icon: typeof Plant }[] = [
  { id: "CUSTOMER", label: "I'm buying food", body: "Shop produce from farms near you", icon: ShoppingBagOpen },
  { id: "FARMER", label: "I'm a farmer", body: "List produce and sell to buyers nearby", icon: Plant },
  { id: "DRIVER", label: "I'm a driver", body: "Pick up local delivery runs", icon: Truck },
  { id: "ORGANISATION", label: "I run a food group", body: "Food bank, school, faith or student group", icon: HandHeart },
  { id: "KITCHEN", label: "I run a kitchen", body: "Cook meals for NomadEat", icon: CookingPot },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setRole } = useApp();
  const [register, { isLoading }] = useRegisterMutation();
  const [step, setStep] = useState<"role" | "details" | "done">("role");
  const [role, setR] = useState<(typeof ROLES)[number]["id"]>("CUSTOMER");
  const [f, setF] = useState({ fullName: "", email: "", password: "", confirm: "", postcode: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f | "form", string>>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!f.fullName.trim()) er.fullName = "Add your name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a full email address.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "The passwords don't match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      await register({ fullName: f.fullName, email: f.email, password: f.password, postcode: f.postcode, country: "United Kingdom", role }).unwrap();
      setStep("done");
    } catch (err) {
      setErrors({ form: (err as { data?: { message?: string } })?.data?.message ?? "Couldn't create your account." });
    }
  }

  const slide = { initial: { opacity: 0, transform: "translateX(12px)" }, animate: { opacity: 1, transform: "translateX(0px)" }, exit: { opacity: 0, transform: "translateX(-12px)" }, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const } };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "role" && (
        <motion.div key="role" {...slide}>
          <h1 className="font-display text-[30px] font-medium tracking-[-0.03em]">Join FarmNomad</h1>
          <p className="mt-1 text-app-muted">How will you use it?</p>
          <div role="radiogroup" aria-label="Account type" className="mt-6 grid gap-2">
            {ROLES.map(({ id, label, body, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={role === id}
                onClick={() => setR(id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left transition-[box-shadow,background-color] duration-150",
                  role === id ? "bg-app-accent-soft shadow-[0_0_0_1.5px_var(--a-accent)]" : "shadow-[0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover",
                )}
              >
                <span className={cn("grid size-9 place-items-center rounded-lg", role === id ? "bg-app-accent text-white dark:text-black" : "bg-app-hover text-app-muted")}>
                  <Icon weight="duotone" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-ui-sm text-app-faint">{body}</span>
                </span>
              </button>
            ))}
          </div>
          <Button variant="primary" className="mt-6 h-10 w-full" onClick={() => setStep("details")}>
            Continue
          </Button>
          <p className="mt-4 text-center text-app-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-app-text underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </motion.div>
      )}

      {step === "details" && (
        <motion.form key="details" {...slide} onSubmit={submit} noValidate>
          <button type="button" onClick={() => setStep("role")} className="mb-4 inline-flex items-center gap-1.5 text-app-muted hover:text-app-text">
            <ArrowLeft className="size-4" /> {ROLES.find((r) => r.id === role)?.label}
          </button>
          <h1 className="font-display text-[30px] font-medium tracking-[-0.03em]">Your details</h1>
          <div className="mt-6 grid gap-4">
            <Field label="Full name" required error={errors.fullName}>
              <input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className={input(!!errors.fullName)} autoComplete="name" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input(!!errors.email)} autoComplete="email" inputMode="email" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" required error={errors.password} hint="8 or more characters">
                <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={input(!!errors.password)} autoComplete="new-password" />
              </Field>
              <Field label="Confirm" required error={errors.confirm}>
                <input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} className={input(!!errors.confirm)} autoComplete="new-password" />
              </Field>
            </div>
            <Field label="Postcode" hint="So we can show farms and deliveries near you">
              <input value={f.postcode} onChange={(e) => setF({ ...f, postcode: e.target.value.toUpperCase() })} className={input(false) + " uppercase"} autoComplete="postal-code" />
            </Field>
            {errors.form && <p className="text-ui-sm text-app-red">{errors.form}</p>}
            <Button type="submit" variant="primary" className="h-10" disabled={isLoading}>
              Create account
            </Button>
          </div>
        </motion.form>
      )}

      {step === "done" && (
        <motion.div key="done" {...slide}>
          <div className="grid size-12 place-items-center rounded-2xl bg-app-accent-soft text-app-accent">
            <EnvelopeSimple weight="duotone" className="size-6" />
          </div>
          <h1 className="mt-6 font-display text-[30px] font-medium tracking-[-0.03em]">Check your email</h1>
          <p className="mt-2 text-app-muted">
            We sent a link to <span className="text-app-text">{f.email}</span>. Open it to verify your account, then sign in.
          </p>
          {(role === "CUSTOMER" || role === "FARMER") && (
            <Button
              variant="primary"
              className="mt-8 h-10 w-full"
              onClick={() => {
                setRole(role);
                router.push(HOME[role]);
              }}
            >
              Continue to the demo
            </Button>
          )}
          {role !== "CUSTOMER" && role !== "FARMER" && (
            <p className="mt-6 text-ui-sm text-app-faint">
              The {{ DRIVER: "driver", ORGANISATION: "food group", KITCHEN: "kitchen" }[role]} side of the app is still being built. We&apos;ll email you when it opens.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
