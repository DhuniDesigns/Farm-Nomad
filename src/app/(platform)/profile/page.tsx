"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { useChangePasswordMutation, useMeQuery, useUpdateMeMutation } from "@/lib/api/farmnomad";
import { PageHeader } from "@/components/app/PageHeader";
import { Field, input } from "@/components/app/ProductSheet";
import { Avatar, Button, Skeleton } from "@/components/app/ui";

/** Profile & settings: user fields from spec §2 (PUT /users/{id}) and change password (POST /auth/change-password). */
export default function ProfilePage() {
  const router = useRouter();
  const { data: me } = useMeQuery();
  const [update, { isLoading: saving }] = useUpdateMeMutation();
  const [changePw, { isLoading: changing }] = useChangePasswordMutation();
  const [f, setF] = useState({ fullName: "", phoneNumber: "", address: "", city: "", postcode: "", country: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (me)
      setF({ fullName: me.fullName, phoneNumber: me.phoneNumber ?? "", address: me.address ?? "", city: me.city ?? "", postcode: me.postcode ?? "", country: me.country ?? "United Kingdom" });
  }, [me]);

  const dirty = !!me && (Object.keys(f) as (keyof typeof f)[]).some((k) => (me[k] ?? "") !== f[k] && !(k === "country" && !me.country && f.country === "United Kingdom"));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!me || !f.fullName.trim()) return;
    try {
      await update({ id: me.id, ...f }).unwrap();
      toast.success("Profile saved");
    } catch {
      toast.error("Couldn't save your profile");
    }
  }

  async function savePw(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw.newPassword.length < 8) return setPwError("Use at least 8 characters.");
    try {
      await changePw(pw).unwrap();
      setPw({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    } catch (err) {
      setPwError((err as { data?: { message?: string } })?.data?.message ?? "Couldn't change your password.");
    }
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      <PageHeader title="Profile" description="Your details, used for deliveries and receipts." />
      <div className="grid gap-4 px-4 md:px-8">
        <form onSubmit={save} className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Personal details">
          <div className="flex items-center gap-4 border-b border-app-line p-5">
            {me ? <Avatar name={me.fullName} className="size-12 text-[15px]" /> : <Skeleton className="size-12 rounded-full" />}
            <div className="min-w-0">
              <p className="truncate font-medium">{me?.fullName ?? " "}</p>
              <p className="truncate text-app-faint">{me?.email}</p>
            </div>
            <span className="ml-auto rounded-full bg-app-accent-soft px-2 py-0.5 text-ui-sm font-medium text-app-accent">{me?.role === "FARMER" ? "Farmer" : "Customer"}</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Full name" required error={me && !f.fullName.trim() ? "Add your name." : undefined}>
                <input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className={input(!!me && !f.fullName.trim())} autoComplete="name" />
              </Field>
            </div>
            <Field label="Email" hint="Contact support to change your email">
              <input value={me?.email ?? ""} readOnly disabled className={input(false) + " opacity-60"} />
            </Field>
            <Field label="Phone">
              <input value={f.phoneNumber} onChange={(e) => setF({ ...f, phoneNumber: e.target.value })} className={input(false)} autoComplete="tel" inputMode="tel" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={input(false)} autoComplete="street-address" />
              </Field>
            </div>
            <Field label="Town or city">
              <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={input(false)} autoComplete="address-level2" />
            </Field>
            <Field label="Postcode">
              <input value={f.postcode} onChange={(e) => setF({ ...f, postcode: e.target.value.toUpperCase() })} className={input(false) + " uppercase"} autoComplete="postal-code" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-app-line px-5 py-3">
            <Button type="submit" variant="primary" disabled={!dirty || saving}>Save changes</Button>
          </div>
        </form>

        <form onSubmit={savePw} className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]" aria-label="Password">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <p className="font-medium sm:col-span-2">Password</p>
            <Field label="Current password">
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={input(false)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters" error={pwError ?? undefined}>
              <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={input(!!pwError)} autoComplete="new-password" />
            </Field>
          </div>
          <div className="flex justify-end border-t border-app-line px-5 py-3">
            <Button type="submit" disabled={!pw.currentPassword || !pw.newPassword || changing}>Change password</Button>
          </div>
        </form>

        <div className="flex items-center justify-between rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-app-faint">You&apos;ll need your email and password to get back in.</p>
          </div>
          <Button
            onClick={() => {
              try {
                window.localStorage.removeItem("fn_token");
              } catch {}
              router.push("/login");
            }}
          >
            <SignOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
