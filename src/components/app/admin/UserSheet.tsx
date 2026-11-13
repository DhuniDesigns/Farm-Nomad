"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowRight, ChatsCircle, EnvelopeSimple, Key, Trash } from "@phosphor-icons/react/dist/ssr";
import { useForgotPasswordMutation, useResendVerificationMutation, useUpdateUserMutation } from "@/lib/api/farmnomad";
import type { User } from "@/lib/types/api";
import { Field, input } from "@/components/app/ProductSheet";
import { Sheet } from "@/components/app/Sheet";
import { Avatar, Button } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import { AdminNote } from "./EditSheets";
import { RoleBadge, roleLabel } from "./parts";

const msg = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "That didn't go through";

/** Where to look next for this kind of user, when sorting out a problem. */
function related(u: User): { href: string; label: string }[] {
  const q = encodeURIComponent(u.fullName);
  switch (u.role) {
    case "FARMER":
      return [
        { href: `/admin/listings?q=${q}`, label: "Their listings" },
        { href: `/admin/orders?q=${q}`, label: "Orders from their farm" },
      ];
    case "CUSTOMER":
      return [{ href: `/admin/orders?q=${q}`, label: "Their orders" }];
    case "DRIVER":
      return [{ href: `/admin/orders?q=${q}`, label: "Their deliveries" }];
    case "ORGANISATION":
      return [
        { href: "/admin/verifications", label: "Their organisation" },
        { href: "/admin/food-rescue", label: "Food rescue" },
      ];
    case "KITCHEN":
      return [{ href: `/admin/listings?tab=meals&q=${q}`, label: "Their meals" }];
    default:
      return [];
  }
}

/**
 * One user, for sorting out problems: fix contact details and address (PUT /users/{id}, ADMIN or
 * owner), send a password reset, resend the verification email, jump to their orders or listings.
 */
export function UserSheet({ user, onClose, onRemove }: { user: User | null; onClose: () => void; onRemove: (u: User) => void }) {
  const [update, { isLoading: saving }] = useUpdateUserMutation();
  const [reset, { isLoading: resetting }] = useForgotPasswordMutation();
  const [resend, { isLoading: resending }] = useResendVerificationMutation();
  const [last, setLast] = useState<User | null>(user);
  const [f, setF] = useState({ fullName: "", phoneNumber: "", address: "", city: "", postcode: "" });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLast(user);
    setErr(null);
    setF({ fullName: user.fullName, phoneNumber: user.phoneNumber ?? "", address: user.address ?? "", city: user.city ?? "", postcode: user.postcode ?? "" });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const u = user ?? last;
  const dirty = !!u && (Object.keys(f) as (keyof typeof f)[]).some((k) => (u[k] ?? "") !== f[k]);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!u) return;
    setErr(null);
    try {
      await update({ id: u.id, ...f }).unwrap();
      toast.success(`${f.fullName} updated`, { description: "Their profile shows the new details straight away." });
    } catch (e) {
      setErr(msg(e));
    }
  }

  return (
    <Sheet open={!!user} onClose={onClose} width={460} title={u?.fullName ?? ""} subtitle={u ? roleLabel[u.role] : undefined}>
      {u && (
        <div className="grid gap-6 px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar name={u.fullName} className="size-12 text-[15px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.fullName}</p>
              <p className="truncate text-app-faint">{u.email}</p>
            </div>
            <RoleBadge role={u.role} />
          </div>

          {/* Details */}
          <form onSubmit={save} className="grid gap-4" aria-label="Contact details">
            <SectionTitle>Contact details</SectionTitle>
            <Field label="Full name" required>
              <input value={f.fullName} onChange={(e) => set("fullName", e.target.value)} className={input(!f.fullName.trim())} autoComplete="off" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input value={f.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} className={cn(input(false), "num")} inputMode="tel" placeholder="07700 900000" autoComplete="off" />
              </Field>
              <Field label="Postcode">
                <input value={f.postcode} onChange={(e) => set("postcode", e.target.value.toUpperCase())} className={cn(input(false), "uppercase")} autoComplete="off" />
              </Field>
            </div>
            <Field label={u.role === "FARMER" ? "Farm address" : u.role === "DRIVER" ? "Home address" : "Address"} hint={u.role === "CUSTOMER" ? "Used for deliveries." : undefined}>
              <input value={f.address} onChange={(e) => set("address", e.target.value)} className={input(false)} autoComplete="off" />
            </Field>
            <Field label="Town or city">
              <input value={f.city} onChange={(e) => set("city", e.target.value)} className={input(false)} autoComplete="off" />
            </Field>
            <Field label="Email" hint="Can't be changed here. Ask them to sign up again with the new address, or raise it with the backend team.">
              <input value={u.email} readOnly disabled className={input(false) + " opacity-60"} />
            </Field>
            {err && <p className="text-ui-sm text-app-red">{err}</p>}
            <div className="flex items-center justify-end gap-2">
              {dirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setF({ fullName: u.fullName, phoneNumber: u.phoneNumber ?? "", address: u.address ?? "", city: u.city ?? "", postcode: u.postcode ?? "" })}
                >
                  Undo changes
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={!dirty || !f.fullName.trim() || saving}>
                Save changes
              </Button>
            </div>
          </form>

          {/* Account help: the usual support cases */}
          <section className="grid gap-2" aria-label="Account help">
            <SectionTitle>Account help</SectionTitle>
            <Action
              icon={<Key className="size-4" />}
              title="Send a password reset link"
              body="They're locked out or forgot their password."
              disabled={resetting}
              onClick={async () => {
                try {
                  await reset({ email: u.email }).unwrap();
                  toast.success("Reset link sent", { description: `To ${u.email}` });
                } catch (e) {
                  toast.error(msg(e));
                }
              }}
            />
            <Action
              icon={<EnvelopeSimple className="size-4" />}
              title="Resend the verification email"
              body="They never got the email to confirm their account."
              disabled={resending}
              onClick={async () => {
                try {
                  await resend({ email: u.email }).unwrap();
                  toast.success("Verification email sent", { description: `To ${u.email}` });
                } catch (e) {
                  toast.error(msg(e));
                }
              }}
            />
            <Link href={`/messages?to=${u.id}&name=${encodeURIComponent(u.fullName)}`} className="block">
              <Action as="div" icon={<ChatsCircle className="size-4" />} title="Message them" body="Ask a question or explain a change you've made." />
            </Link>
          </section>

          {related(u).length > 0 && (
            <section className="grid gap-1" aria-label="Related">
              <SectionTitle>Look into</SectionTitle>
              {related(u).map((r) => (
                <Link key={r.href} href={r.href} className="group flex items-center justify-between rounded-lg px-3 py-2 text-app-muted transition-colors hover:bg-app-hover hover:text-app-text">
                  {r.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </section>
          )}

          {u.role !== "ADMIN" && (
            <section className="grid gap-2 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-red-soft)]" aria-label="Remove account">
              <p className="font-medium">Remove account</p>
              <p className="text-ui-sm text-app-muted">For fake sign-ups or people who asked to leave. Their past orders stay in the records.</p>
              <div>
                <Button variant="ghost" className="text-app-red" onClick={() => onRemove(u)}>
                  <Trash className="size-4" /> Remove {u.fullName.split(" ")[0]}
                </Button>
              </div>
            </section>
          )}
          <AdminNote>Role and email can&apos;t be edited from here: they aren&apos;t in the user update API (spec §3.2).</AdminNote>
        </div>
      )}
    </Sheet>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-faint">{children}</p>;
}

function Action({ icon, title, body, onClick, disabled, as }: { icon: ReactNode; title: string; body: string; onClick?: () => void; disabled?: boolean; as?: "div" }) {
  const cls = "flex w-full items-start gap-3 rounded-xl p-3 text-left shadow-[0_0_0_1px_var(--a-line)] transition-colors hover:bg-app-hover disabled:opacity-50";
  const inner = (
    <>
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-app-hover text-app-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block text-ui-sm text-app-faint">{body}</span>
      </span>
    </>
  );
  return as === "div" ? (
    <div className={cls}>{inner}</div>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}
