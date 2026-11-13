"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  AppleLogo,
  ArrowLeft,
  Buildings,
  CheckCircle,
  CookingPot,
  EnvelopeSimple,
  GoogleLogo,
  HandHeart,
  LockSimple,
  MapPin,
  Phone,
  Plant,
  ShoppingBagOpen,
  Truck,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useForgotPasswordMutation, useLoginMutation, useRegisterMutation } from "@/lib/api/farmnomad";
import { HOME, ROLE_META } from "@/lib/navigation";
import type { MockRole, Role } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { cn } from "@/lib/cn";
import { AuthInput, Checkbox, Chip, Divider, PrimaryButton, Segmented, SoftButton } from "./parts";

export type AuthMode = "login" | "register" | "forgot";
type SignupRole = Exclude<Role, "ADMIN">;

// Spec §7.2: the five roles you can sign up as (never ADMIN), with what each side of FarmNomad offers.
const ROLES: Record<SignupRole, { label: string; short: string; body: string; icon: typeof Plant; img: string; title: string; points: string[]; section: string }> = {
  CUSTOMER: {
    label: "I'm buying food",
    short: "Customer",
    body: "Shop produce from farms near you",
    icon: ShoppingBagOpen,
    img: "/images/hero.webp",
    title: "Buy straight from the farms near you.",
    points: ["Produce from North West farms, listed by the farmer", "Surplus deals at lower prices", "Track every order from the farm gate to your door"],
    section: "Delivery",
  },
  FARMER: {
    label: "I'm a farmer",
    short: "Farmer",
    body: "List produce and sell to buyers nearby",
    icon: Plant,
    img: "/images/harvest-hands.webp",
    title: "Sell what you grow to buyers within miles.",
    points: ["List produce in a couple of minutes", "Paid through Stripe when the order is placed", "Send surplus to food banks instead of the bin"],
    section: "Your farm",
  },
  DRIVER: {
    label: "I'm a driver",
    short: "Driver",
    body: "Pick up local delivery runs",
    icon: Truck,
    img: "/images/route-aerial.webp",
    title: "Short runs between farms and front doors.",
    points: ["Choose the runs that suit you", "Clear pickup and drop-off details", "Local routes, not motorway miles"],
    section: "Your driving",
  },
  ORGANISATION: {
    label: "I run a food group",
    short: "Food group",
    body: "Food bank, school, faith or student group",
    icon: HandHeart,
    img: "/images/step-pack-wide.webp",
    title: "Claim good surplus food for your community.",
    points: ["Free surplus from local farms", "For food banks, schools, faith and student groups", "Collected and delivered by local drivers"],
    section: "Your organisation",
  },
  KITCHEN: {
    label: "I run a kitchen",
    short: "Kitchen",
    body: "Cook meals for NomadEat",
    icon: CookingPot,
    img: "/images/greenhouse.webp",
    title: "Cook with produce from the farm down the road.",
    points: ["Sell ready meals on NomadEat", "Buy ingredients direct from local farms", "Show diners which farms your food came from"],
    section: "Your kitchen",
  },
};
const ORDER: SignupRole[] = ["CUSTOMER", "FARMER", "DRIVER", "ORGANISATION", "KITCHEN"];

const LOGIN_VISUAL = {
  img: "/images/gate-dusk.webp",
  title: "Food straight from UK farms, tracked to your door.",
  points: ["One account for buying, selling and delivering", "Launching across the North West, rolling out UK-wide"],
};

const PATH: Record<AuthMode, string> = { login: "/login", register: "/register", forgot: "/forgot-password" };
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const ease = [0.23, 1, 0.32, 1] as const;

export function AuthScreen({ initial }: { initial: AuthMode }) {
  const [mode, setModeState] = useState<AuthMode>(initial);
  // ?role=FARMER (from the website's "Join as" links) picks the role up front.
  const [role, setRole] = useState<SignupRole>(() => {
    const r = new URLSearchParams(window.location.search).get("role")?.toUpperCase();
    return r && r in ROLES ? (r as SignupRole) : "CUSTOMER";
  });
  const [step, setStep] = useState<"role" | "details" | "done">("role");
  const details = useState<Details>(EMPTY); // lives here so it survives moving between steps

  // Switch in place (keeps the animation) and keep the URL honest for refresh and sharing.
  const setMode = (m: AuthMode) => {
    setModeState(m);
    if (m === "register") setStep("role");
    window.history.replaceState(null, "", PATH[m]);
  };

  const visual = mode === "register" ? ROLES[role] : LOGIN_VISUAL;
  const visualKey = mode === "register" ? role : "login";

  return (
    <div className="grid min-h-[100dvh] bg-app-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:p-3">
      {/* Left: the visual panel, framed with a double bezel */}
      <div className="hidden lg:block">
        <div className="sticky top-3 h-[calc(100dvh-24px)] rounded-[30px] bg-app-hover p-1.5 shadow-[inset_0_0_0_1px_var(--a-line)]">
          <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0C0E0D] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06),0_24px_48px_-24px_rgb(0_0_0/0.5)]">
            <AnimatePresence initial={false}>
              <motion.div key={visual.img} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
                <Image src={visual.img} alt="" fill sizes="50vw" priority className="object-cover [mask-image:linear-gradient(180deg,transparent_8%,black_55%)]" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0C0E0D_0%,rgb(12_14_13/0.85)_28%,transparent_60%,rgb(0_0_0/0.35)_100%)]" />

            <div className="relative flex h-full flex-col p-10">
              <Link href="/" aria-label="FarmNomad home" className="w-fit">
                <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} className="h-7 w-auto" />
              </Link>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={visualKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }} className="mt-14 max-w-[30ch]">
                  {mode === "register" && <p className="text-[13px] font-medium text-[#B9E66F]">For {ROLES[role].short.toLowerCase()}s</p>}
                  <h2 className="mt-2 font-display text-[clamp(28px,2.6vw,40px)] font-medium leading-[1.08] tracking-[-0.03em] text-white">{visual.title}</h2>
                  <ul className="mt-6 grid gap-2.5">
                    {visual.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14px] text-white/70">
                        <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-[#B9E66F]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
              <div className="mt-auto flex items-center gap-2.5 self-start rounded-full bg-black/40 py-2 pl-3 pr-4 text-[13px] text-white/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] backdrop-blur-md">
                <span className="relative grid size-2 place-items-center">
                  <span className="absolute size-2 animate-ping rounded-full bg-[#B9E66F]/60 motion-reduce:animate-none" />
                  <span className="size-2 rounded-full bg-[#B9E66F]" />
                </span>
                Live in the North West · rolling out UK-wide
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: the form */}
      <div className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10 lg:min-h-0">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" aria-label="FarmNomad home" className="lg:hidden">
            <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} className="h-6 w-auto dark:hidden" />
            <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} className="hidden h-6 w-auto dark:block" />
          </Link>
          <Link href="/" className="text-ui-sm text-app-faint transition-colors hover:text-app-text">
            Back to website
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {mode !== "forgot" && (
            <div className="mb-10 flex justify-center">
              <Segmented
                label="Log in or sign up"
                value={mode === "login" ? "login" : "register"}
                options={[
                  ["login", "Log in"],
                  ["register", "Sign up"],
                ]}
                onChange={(m) => setMode(m as AuthMode)}
              />
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode + (mode === "register" ? step : "")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease }}>
              {mode === "login" && <LoginForm onForgot={() => setMode("forgot")} onSignup={() => setMode("register")} />}
              {mode === "forgot" && <ForgotForm onBack={() => setMode("login")} />}
              {mode === "register" && <Register role={role} setRole={setRole} step={step} setStep={setStep} details={details} onLogin={() => setMode("login")} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-[30px] font-medium tracking-[-0.03em]">{title}</h1>
      {sub && <p className="mt-1.5 text-app-muted">{sub}</p>}
    </div>
  );
}

function Socials({ verb }: { verb: string }) {
  // Not in the API yet (spec §3.1 has email + password only); kept visible so the layout is final.
  const soon = (p: string) => toast(`${p} sign-in is on the way`, { description: `${verb} with your email for now.` });
  return (
    <>
      <Divider>Or {verb.toLowerCase()} with</Divider>
      <div className="grid grid-cols-2 gap-3">
        <SoftButton onClick={() => soon("Google")}>
          <GoogleLogo weight="bold" className="size-[18px]" /> Google
        </SoftButton>
        <SoftButton onClick={() => soon("Apple")}>
          <AppleLogo weight="fill" className="size-[18px]" /> Apple
        </SoftButton>
      </div>
    </>
  );
}

/* ─── Log in ─────────────────────────────────────────────────────────── */

function LoginForm({ onForgot, onSignup }: { onForgot: () => void; onSignup: () => void }) {
  const router = useRouter();
  const { setRole } = useApp();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent | null, as?: MockRole) {
    e?.preventDefault();
    setError(null);
    if (!as && (!email || !password)) return setError("Enter your email and password.");
    const creds = as ? { email: ROLE_META[as].demoEmail, password: "demo-password" } : { email, password };
    try {
      const { token } = await login(creds).unwrap();
      try {
        window.localStorage.setItem("fn_token", token);
      } catch {}
      // Real API: GET /users/me → routeAfterLogin(me.role). The demo picks the role from the account.
      const role: MockRole = as ?? ((Object.keys(ROLE_META) as MockRole[]).find((r) => ROLE_META[r].demoEmail === creds.email.toLowerCase()) ?? (/farm/i.test(creds.email) ? "FARMER" : "CUSTOMER"));
      setRole(role);
      router.push(HOME[role]);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? "Something went wrong. Try again.");
    }
  }

  return (
    <>
      <Heading title="Welcome back" sub="Log in to your FarmNomad account." />
      <form onSubmit={submit} noValidate className="grid gap-4">
        <AuthInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" inputMode="email" icon={<EnvelopeSimple className="size-[18px]" />} />
        <AuthInput
          label="Password"
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={<LockSimple className="size-[18px]" />}
          labelAside={
            <button type="button" onClick={onForgot} className="text-ui-sm font-medium text-app-accent hover:underline">
              Forgot password?
            </button>
          }
        />
        <Checkbox checked={show} onChange={setShow}>
          Show password
        </Checkbox>
        <p aria-live="polite" className={cn("text-ui-sm text-app-red", !error && "sr-only")}>
          {error}
        </p>
        <PrimaryButton type="submit" loading={isLoading} className="mt-1">
          Log in
        </PrimaryButton>
      </form>
      <div className="mt-7 grid gap-5">
        <Socials verb="Log in" />
      </div>
      <p className="mt-7 text-center text-app-muted">
        New to FarmNomad?{" "}
        <button type="button" onClick={onSignup} className="font-medium text-app-text underline underline-offset-2">
          Create an account
        </button>
      </p>
      <div className="mt-8 grid justify-items-center gap-2 text-ui-sm text-app-faint">
        Explore the demo as
        <div className="flex flex-wrap justify-center gap-1.5">
          {(Object.keys(ROLE_META) as MockRole[]).map((r) => (
            <button key={r} type="button" onClick={() => submit(null, r)} className="rounded-full px-2.5 py-1 font-medium text-app-text shadow-[inset_0_0_0_1px_var(--a-line-strong)] transition-colors hover:bg-app-hover">
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Forgot password (spec §7.2 /forgot-password) ───────────────────── */

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [send, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await send({ email }).unwrap();
      setSent(true);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? "Couldn't send the link. Try again.");
    }
  }

  return (
    <>
      <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 text-app-muted hover:text-app-text">
        <ArrowLeft className="size-4" /> Back to log in
      </button>
      {sent ? (
        <SentNote email={email} title="Check your email" body="Open the link we sent to choose a new password. It expires in an hour." />
      ) : (
        <>
          <Heading title="Reset your password" sub="We'll email you a link to choose a new one." />
          <form onSubmit={submit} noValidate className="grid gap-5">
            <AuthInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" inputMode="email" icon={<EnvelopeSimple className="size-[18px]" />} error={error ?? undefined} />
            <PrimaryButton type="submit" loading={isLoading}>
              Send reset link
            </PrimaryButton>
          </form>
        </>
      )}
    </>
  );
}

function SentNote({ email, title, body }: { email: string; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-app-accent-soft text-app-accent shadow-[inset_0_0_0_1px_var(--a-accent-soft)]">
        <EnvelopeSimple weight="duotone" className="size-7" />
      </div>
      <h1 className="mt-6 font-display text-[28px] font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-app-muted">
        We sent it to <span className="font-medium text-app-text">{email}</span>. {body}
      </p>
      <button type="button" onClick={() => toast.success("Sent again", { description: `Check ${email}` })} className="mt-4 text-ui-sm font-medium text-app-accent hover:underline">
        Didn&apos;t get it? Send again
      </button>
    </div>
  );
}

/* ─── Sign up: pick a role, then details for that role ───────────────── */

type Details = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirm: string;
  postcode: string;
  orgName: string; // farm, organisation or kitchen name
  grows: string[];
  vehicle: string;
  radius: string;
  orgType: string;
  charityNumber: string;
  hygiene: string;
  groupBuying: boolean;
  terms: boolean;
};
const EMPTY: Details = { fullName: "", email: "", phoneNumber: "", password: "", confirm: "", postcode: "", orgName: "", grows: [], vehicle: "", radius: "10", orgType: "", charityNumber: "", hygiene: "", groupBuying: true, terms: false };

function Register({
  role,
  setRole,
  step,
  setStep,
  details: [f, setF],
  onLogin,
}: {
  role: SignupRole;
  setRole: (r: SignupRole) => void;
  step: "role" | "details" | "done";
  setStep: (s: "role" | "details" | "done") => void;
  details: [Details, Dispatch<SetStateAction<Details>>];
  onLogin: () => void;
}) {
  const router = useRouter();
  const app = useApp();
  const [register, { isLoading }] = useRegisterMutation();
  const [errors, setErrors] = useState<Partial<Record<keyof Details | "form", string>>>({});
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setF((p) => ({ ...p, [k]: v }));
  const meta = ROLES[role];

  function validate() {
    const er: typeof errors = {};
    if (!f.fullName.trim()) er.fullName = "Add your name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a full email address.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "The passwords don't match.";
    if (!POSTCODE.test(f.postcode.trim())) er.postcode = "Enter a UK postcode, like PR1 8JA.";
    if (role !== "CUSTOMER" && !f.phoneNumber.trim()) er.phoneNumber = "Add a number so buyers and drivers can reach you.";
    if ((role === "FARMER" || role === "ORGANISATION" || role === "KITCHEN") && !f.orgName.trim()) er.orgName = "Add a name.";
    if (role === "ORGANISATION" && !f.orgType) er.orgType = "Pick the type of group.";
    if (role === "DRIVER" && !f.vehicle) er.vehicle = "Pick what you drive.";
    if (!f.terms) er.terms = "You need to agree before we can create your account.";
    return er;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;
    try {
      // POST /auth/register takes the user fields + role (spec §3.1). The role details below are sent
      // alongside for now; organisations then call POST /organisations {name, type, charityNumber} after
      // verifying. Farm, driver and kitchen profile endpoints are still to confirm with the backend.
      await register({
        fullName: f.fullName,
        email: f.email,
        password: f.password,
        phoneNumber: f.phoneNumber,
        postcode: f.postcode.toUpperCase(),
        country: "United Kingdom",
        role,
        ...(f.orgName && { organisationName: f.orgName }),
        ...(role === "FARMER" && { produce: f.grows.join(",") }),
        ...(role === "DRIVER" && { vehicle: f.vehicle, radiusMiles: f.radius }),
        ...(role === "ORGANISATION" && { organisationType: f.orgType, charityNumber: f.charityNumber }),
        ...(role === "KITCHEN" && { hygieneRating: f.hygiene }),
      }).unwrap();
      setStep("done");
    } catch (err) {
      setErrors({ form: (err as { data?: { message?: string } })?.data?.message ?? "Couldn't create your account." });
    }
  }

  if (step === "done")
    return (
      <>
        <SentNote email={f.email} title="Check your email" body="Open the link to verify your account, then log in." />
        <PrimaryButton
          className="mt-8"
          onClick={() => {
            app.setRole(role);
            router.push(HOME[role]);
          }}
        >
          Continue to the demo
        </PrimaryButton>
      </>
    );

  if (step === "role")
    return (
      <>
        <Heading title="Create your account" sub="How will you use FarmNomad?" />
        <div role="radiogroup" aria-label="Account type" className="grid gap-2">
          {ORDER.map((id) => {
            const r = ROLES[id];
            const on = role === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRole(id)}
                className={cn(
                  "flex items-center gap-3.5 rounded-[16px] p-3 text-left transition-[box-shadow,background-color] duration-150 active:scale-[0.99]",
                  on ? "bg-app-accent-soft shadow-[inset_0_0_0_1.5px_var(--a-accent)]" : "shadow-[inset_0_0_0_1px_var(--a-line-strong)] hover:bg-app-hover",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-[12px] transition-colors",
                    on ? "bg-app-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] dark:text-black" : "bg-app-hover text-app-muted",
                  )}
                >
                  <r.icon weight="duotone" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{r.label}</span>
                  <span className="block text-ui-sm text-app-faint">{r.body}</span>
                </span>
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-shadow", on ? "shadow-[inset_0_0_0_6px_var(--a-accent)]" : "shadow-[inset_0_0_0_1.5px_var(--a-line-strong)]")} />
              </button>
            );
          })}
        </div>
        <PrimaryButton className="mt-6" onClick={() => setStep("details")}>
          Continue as {meta.short.toLowerCase()}
        </PrimaryButton>
        <p className="mt-6 text-center text-app-muted">
          Already have an account?{" "}
          <button type="button" onClick={onLogin} className="font-medium text-app-text underline underline-offset-2">
            Log in
          </button>
        </p>
      </>
    );

  // Details
  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setStep("role")} className="inline-flex items-center gap-1.5 text-app-muted hover:text-app-text">
          <ArrowLeft className="size-4" /> Back
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-app-accent-soft py-1 pl-1.5 pr-3 text-ui-sm font-medium text-app-accent">
          <span className="grid size-5 place-items-center rounded-full bg-app-accent text-white dark:text-black">
            <meta.icon weight="bold" className="size-3" />
          </span>
          Signing up as {meta.short.toLowerCase()}
        </span>
      </div>
      <div className="mb-7 flex gap-1.5" aria-hidden>
        <span className="h-1 flex-1 rounded-full bg-app-accent" />
        <span className="h-1 flex-1 rounded-full bg-app-accent" />
      </div>
      <h1 className="font-display text-[28px] font-medium tracking-[-0.03em]">Your details</h1>
      <p className="mt-1 text-app-muted">Step 2 of 2</p>

      <Section title="About you">
        <AuthInput label="Full name" required value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your name" autoComplete="name" icon={<UserIcon className="size-[18px]" />} error={errors.fullName} />
        <AuthInput label="Email" required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Enter your email address" autoComplete="email" inputMode="email" icon={<EnvelopeSimple className="size-[18px]" />} error={errors.email} />
        <AuthInput
          label="Phone"
          required={role !== "CUSTOMER"}
          type="tel"
          value={f.phoneNumber}
          onChange={(e) => set("phoneNumber", e.target.value)}
          placeholder="07700 900000"
          autoComplete="tel"
          inputMode="tel"
          icon={<Phone className="size-[18px]" />}
          error={errors.phoneNumber}
          hint={role === "CUSTOMER" ? "Optional. Only your driver sees it." : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput label="Password" required type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="8 or more characters" autoComplete="new-password" icon={<LockSimple className="size-[18px]" />} error={errors.password} />
          <AuthInput label="Confirm" required type="password" value={f.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Type it again" autoComplete="new-password" icon={<LockSimple className="size-[18px]" />} error={errors.confirm} />
        </div>
      </Section>

      <Section title={meta.section}>
        {role === "FARMER" && (
          <>
            <AuthInput label="Farm name" required value={f.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="e.g. Hollins Farm" icon={<Plant className="size-[18px]" />} error={errors.orgName} />
            <PostcodeField f={f} set={set} error={errors.postcode} label="Farm postcode" hint="Where buyers' orders are collected from." />
            <Choice label="What do you grow or rear?" hint="Pick any. You can change this later.">
              {["Vegetables", "Fruit", "Dairy", "Eggs", "Meat", "Grains", "Herbs"].map((g) => (
                <Chip key={g} on={f.grows.includes(g)} onClick={() => set("grows", f.grows.includes(g) ? f.grows.filter((x) => x !== g) : [...f.grows, g])}>
                  {g}
                </Chip>
              ))}
            </Choice>
          </>
        )}
        {role === "CUSTOMER" && (
          <>
            <PostcodeField f={f} set={set} error={errors.postcode} label="Delivery postcode" hint="So we can show the farms that deliver to you." />
            <Checkbox checked={f.groupBuying} onChange={(v) => set("groupBuying", v)}>
              Tell me when group buying opens, so I can buy with others at wholesale prices.
            </Checkbox>
          </>
        )}
        {role === "DRIVER" && (
          <>
            <PostcodeField f={f} set={set} error={errors.postcode} label="Home postcode" hint="We offer runs that start near you." />
            <Choice label="What do you drive?" error={errors.vehicle}>
              {["Car", "Van", "Refrigerated van", "Cargo bike"].map((v) => (
                <Chip key={v} on={f.vehicle === v} onClick={() => set("vehicle", v)}>
                  {v}
                </Chip>
              ))}
            </Choice>
            <Choice label="How far will you travel?">
              {["5", "10", "20", "30"].map((m) => (
                <Chip key={m} on={f.radius === m} onClick={() => set("radius", m)}>
                  {m} miles
                </Chip>
              ))}
            </Choice>
          </>
        )}
        {role === "ORGANISATION" && (
          <>
            <AuthInput label="Organisation name" required value={f.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="e.g. St Mary's Food Bank" icon={<Buildings className="size-[18px]" />} error={errors.orgName} />
            {/* Spec §3.11: type ∈ FOODBANK, SCHOOL, RELIGIOUS, STUDENT_GROUP */}
            <Choice label="Type of group" error={errors.orgType}>
              {[
                ["FOODBANK", "Food bank"],
                ["SCHOOL", "School"],
                ["RELIGIOUS", "Faith group"],
                ["STUDENT_GROUP", "Student group"],
              ].map(([v, l]) => (
                <Chip key={v} on={f.orgType === v} onClick={() => set("orgType", v)}>
                  {l}
                </Chip>
              ))}
            </Choice>
            <AuthInput label="Charity number" value={f.charityNumber} onChange={(e) => set("charityNumber", e.target.value)} placeholder="Optional" inputMode="numeric" hint="Registered charities are verified faster." />
            <PostcodeField f={f} set={set} error={errors.postcode} label="Collection postcode" hint="Where surplus is delivered or collected." />
          </>
        )}
        {role === "KITCHEN" && (
          <>
            <AuthInput label="Kitchen name" required value={f.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="e.g. Fishergate Kitchen" icon={<CookingPot className="size-[18px]" />} error={errors.orgName} />
            <PostcodeField f={f} set={set} error={errors.postcode} label="Kitchen postcode" />
            <Choice label="Food hygiene rating" hint="From your Food Standards Agency inspection.">
              {["5", "4", "3", "Awaiting inspection"].map((h) => (
                <Chip key={h} on={f.hygiene === h} onClick={() => set("hygiene", h)}>
                  {h}
                </Chip>
              ))}
            </Choice>
          </>
        )}
      </Section>

      <div className="mt-6 grid gap-2">
        <Checkbox checked={f.terms} onChange={(v) => set("terms", v)}>
          I agree to FarmNomad&apos;s terms of service and privacy policy.
        </Checkbox>
        {errors.terms && <p className="text-ui-sm text-app-red">{errors.terms}</p>}
      </div>
      {errors.form && <p className="mt-4 text-ui-sm text-app-red">{errors.form}</p>}
      <PrimaryButton type="submit" loading={isLoading} className="mt-6">
        Create {meta.short.toLowerCase()} account
      </PrimaryButton>
      <div className="mt-6 grid gap-5">
        <Socials verb="Sign up" />
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-7 grid gap-4">
      <legend className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-app-faint">{title}</legend>
      {children}
    </fieldset>
  );
}

function Choice({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2" role="group" aria-label={label}>
      <span className="text-[13px] font-medium text-app-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
      {(error || hint) && <p className={cn("text-ui-sm", error ? "text-app-red" : "text-app-faint")}>{error ?? hint}</p>}
    </div>
  );
}

function PostcodeField({ f, set, error, label, hint }: { f: Details; set: <K extends keyof Details>(k: K, v: Details[K]) => void; error?: string; label: string; hint?: string }) {
  return (
    <AuthInput
      label={label}
      required
      value={f.postcode}
      onChange={(e) => set("postcode", e.target.value.toUpperCase())}
      placeholder="PR1 8JA"
      autoComplete="postal-code"
      icon={<MapPin className="size-[18px]" />}
      error={error}
      hint={hint}
      className="[&_input]:uppercase [&_input]:placeholder:normal-case"
    />
  );
}
