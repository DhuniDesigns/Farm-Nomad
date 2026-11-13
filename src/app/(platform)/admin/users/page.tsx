"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { useDeleteUserMutation, useListUsersQuery, useMockRestoreUserMutation } from "@/lib/api/farmnomad";
import type { Role, User } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { UserSheet } from "@/components/app/admin/UserSheet";
import { Confirm, Filters, RoleBadge, Search, Table, roleLabel, td, tr } from "@/components/app/admin/parts";
import { Avatar, EmptyState, IconButton, relDay } from "@/components/app/ui";

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

  // Links from orders and other admin pages: /admin/users?open=501 or ?q=Amara
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("q")) setQ(sp.get("q")!);
    const id = Number(sp.get("open"));
    if (id && data) {
      const u = data.find((x) => x.id === id);
      if (u) setOpen(u);
    }
  }, [data]);

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

      <UserSheet user={open ? (data?.find((u) => u.id === open.id) ?? open) : null} onClose={() => setOpen(null)} onRemove={setRemoving} />

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
