"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { useLoginMutation } from "@/lib/api/farmnomad";
import { HOME } from "@/lib/navigation";
import type { MockRole } from "@/lib/types/api";
import { useApp } from "@/components/app/AppState";
import { Field, input } from "@/components/app/ProductSheet";
import { Button } from "@/components/app/ui";

/** Spec §7.2 /login: email, password (show/hide), forgot link, register link, inline error. */
export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useApp();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent, as?: MockRole) {
    e.preventDefault();
    setError(null);
    const creds = as ? { email: as === "FARMER" ? "tom@hollinsfarm.co.uk" : "amara.okafor@example.com", password: "demo-password" } : { email, password };
    try {
      const { token } = await login(creds).unwrap();
      try {
        window.localStorage.setItem("fn_token", token);
      } catch {}
      // With the real API: GET /users/me → routeAfterLogin(me.role). The demo picks the role from the account.
      const role: MockRole = as ?? (/farm/i.test(creds.email) ? "FARMER" : "CUSTOMER");
      setRole(role);
      router.push(HOME[role]);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? "Something went wrong. Try again.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-[30px] font-medium tracking-[-0.03em]">Welcome back</h1>
      <p className="mt-1 text-app-muted">Sign in to your FarmNomad account.</p>

      <form onSubmit={(e) => submit(e)} noValidate className="mt-8 grid gap-4">
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input(!!error)} autoComplete="email" inputMode="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input(!!error) + " pr-10"} autoComplete="current-password" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-app-faint hover:text-app-text">
              {show ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div aria-live="polite" className="min-h-5 text-ui-sm text-app-red">{error}</div>
        <Button type="submit" variant="primary" className="h-10" disabled={isLoading}>
          {isLoading ? "Signing in" : "Sign in"}
        </Button>
        <p className="text-center text-app-muted">
          New to FarmNomad?{" "}
          <Link href="/register" className="font-medium text-app-text underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </form>

      <div className="mt-10 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
        <p className="text-ui-sm font-medium uppercase tracking-wide text-app-faint">Demo accounts</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={(e) => submit(e, "CUSTOMER")}>Customer</Button>
          <Button onClick={(e) => submit(e, "FARMER")}>Farmer</Button>
        </div>
      </div>
    </div>
  );
}
