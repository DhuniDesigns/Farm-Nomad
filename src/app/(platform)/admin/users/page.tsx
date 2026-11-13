"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatsCircle, Trash, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { useDeleteUserMutation, useListUsersQuery, useMockRestoreUserMutation } from "@/lib/api/farmnomad";
import type { Role, User } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Sheet } from "@/components/app/Sheet";
import { Confirm, Filters, RoleBadge, Search, Table, roleLabel, td, tr } from "@/components/app/admin/parts";
import { Avatar, Button, EmptyState, IconButton, relDay } from "@/components/app/ui";

type F = "all" | Role;
const ORDER: Role[] = ["CUSTOMER", "FARMER", "DRIVER", "ORGANISATION", "KITCHEN", "ADMIN"];

/** Admin users (spec §3.2 GET /users, DELETE /users/{id}). */
export default function AdminUsers() {
  const { data, isLoading } = useListUsersQuery();
  const [del, { isLoading: deleting }] = useDeleteUserMutation();
  const [restore] = useMockRestoreUserMutation();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<User | null>(null);
  const [removing, setRemoving] = useState<User | null>(null);

  const rows = useMemo(
    () => (data ?? []).filter((u) => (f === "all" || u.role === f) && `${u.fullName} ${u.email} ${u.city ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [data, f, q],
  );

  async function remove() {
    if (!removing) return;
    const u = removing;
    try {
      await del(u.id).unwrap();
      setRemoving(null);
      setOpen(null);
      toast(`Removed ${u.fullName}`, { action: { label: "Undo", onClick: () => restore(u) } });
    } catch (e) {
      setRemoving(null);
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "Couldn't remove that account");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Users" description={data ? `${data.length} people across every role.` : "Everyone on FarmNomad."} />
      <div className="grid gap-3 px-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Filters id="users" value={f} onChange={setF} options={[{ id: "all" as F, label: "All", n: data?.length }, ...ORDER.map((r) => ({ id: r as F, label: roleLabel[r], n: data?.filter((u) => u.role === r).length }))]} />
          <Search value={q} onChange={setQ} placeholder="Search name, email or town" />
        </div>
        <Table
          head={["Name", "Role", "Town", "Joined", ""]}
          loading={isLoading}
          empty={!rows.length && !isLoading ? <EmptyState icon={<UsersThree className="size-5" />} title="No one matches" body="Try another name or clear the filter." /> : undefined}
        >
          {rows.map((u) => (
            <tr key={u.id} className={tr + " cursor-pointer"} onClick={() => setOpen(u)}>
              <td className={td}>
                <span className="flex items-center gap-3">
                  <Avatar name={u.fullName} className="size-8 text-[11px]" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.fullName}</span>
                    <span className="block truncate text-ui-sm text-app-faint">{u.email}</span>
                  </span>
                </span>
              </td>
              <td className={td}>
                <RoleBadge role={u.role} />
              </td>
              <td className={td + " text-app-muted"}>{u.city ?? "–"}</td>
              <td className={td + " num text-ui-sm text-app-muted"}>{u.createdAt ? relDay(u.createdAt) : "–"}</td>
              <td className={td + " w-12 text-right"}>
                {u.role !== "ADMIN" && (
                  <IconButton
                    label={`Remove ${u.fullName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoving(u);
                    }}
                  >
                    <Trash className="size-4" />
                  </IconButton>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} width={420} title={open?.fullName ?? ""} subtitle={open ? roleLabel[open.role] : undefined}>
        {open && (
          <div className="grid gap-5 px-5 py-5">
            <div className="flex items-center gap-3">
              <Avatar name={open.fullName} className="size-12 text-[15px]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{open.fullName}</p>
                <p className="truncate text-app-faint">{open.email}</p>
              </div>
            </div>
            <dl className="grid gap-3 rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
              <Row k="Role" v={<RoleBadge role={open.role} />} />
              <Row k="Phone" v={open.phoneNumber ?? "–"} />
              <Row k="Address" v={[open.address, open.city, open.postcode].filter(Boolean).join(", ") || "–"} />
              <Row k="Joined" v={open.createdAt ? new Date(open.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "–"} />
              <Row k="User ID" v={<span className="num">{open.id}</span>} />
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link href={`/messages?to=${open.id}&name=${encodeURIComponent(open.fullName)}`}>
                <Button>
                  <ChatsCircle className="size-4" /> Message
                </Button>
              </Link>
              {open.role !== "ADMIN" && (
                <Button variant="ghost" className="text-app-red" onClick={() => setRemoving(open)}>
                  <Trash className="size-4" /> Remove account
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>

      <Confirm
        open={!!removing}
        title={`Remove ${removing?.fullName}?`}
        body="They'll lose access straight away. Their past orders stay in the records."
        action="Remove account"
        danger
        busy={deleting}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-20 shrink-0 text-app-muted">{k}</dt>
      <dd className="min-w-0 truncate">{v}</dd>
    </div>
  );
}
