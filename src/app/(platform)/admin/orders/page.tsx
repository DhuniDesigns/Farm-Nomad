"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift, Receipt } from "@phosphor-icons/react/dist/ssr";
import { useAdminAssignOrderMutation, useAdminOrderStatusMutation, useListOrdersAdminQuery, useListUsersQuery } from "@/lib/api/farmnomad";
import type { Order, OrderStatus } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { Confirm, Filters, Search, Table, td, tr } from "@/components/app/admin/parts";
import { paymentMeta, statusMeta } from "@/components/app/orderMeta";
import { Button, EmptyState, Pill, gbp, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

type F = "all" | OrderStatus;
const FLOW: OrderStatus[] = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  ASSIGNED: { to: "IN_TRANSIT", label: "Mark collected" },
  IN_TRANSIT: { to: "DELIVERED", label: "Mark delivered" },
};
const msg = (e: unknown) => (e as { data?: { message?: string } })?.data?.message ?? "That didn't go through";

/** Admin orders (spec §3.7 GET /orders?status=, PATCH assign with driverId, PATCH status). */
export default function AdminOrders() {
  const [f, setF] = useState<F>("all");
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status") as OrderStatus | null;
    if (s && FLOW.includes(s)) setF(s);
    if (sp.get("q")) setQ(sp.get("q")!);
  }, []);
  const { data, isLoading } = useListOrdersAdminQuery();
  const { data: users } = useListUsersQuery();
  const drivers = users?.filter((u) => u.role === "DRIVER") ?? [];
  const [assign] = useAdminAssignOrderMutation();
  const [setStatus, { isLoading: busy }] = useAdminOrderStatusMutation();
  const [q, setQ] = useState("");
  const [cancelling, setCancelling] = useState<(Order & { total: number }) | null>(null);

  const rows = useMemo(
    () => (data ?? []).filter((o) => (f === "all" || o.status === f) && `${o.id} ${o.productName} ${o.customerName} ${o.farmerName ?? ""} ${o.driverName ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [data, f, q],
  );

  const select = (v: F) => {
    setF(v);
    window.history.replaceState(null, "", v === "all" ? "/admin/orders" : `/admin/orders?status=${v}`);
  };

  async function onAssign(o: Order, driverId: number) {
    try {
      await assign({ id: o.id, driverId }).unwrap();
      toast.success(`${orderRef(o.id)} assigned`, { description: `${drivers.find((d) => d.id === driverId)?.fullName} has been told.` });
    } catch (e) {
      toast.error(msg(e));
    }
  }
  async function move(o: Order, to: OrderStatus) {
    try {
      await setStatus({ id: o.id, status: to }).unwrap();
      toast.success(to === "CANCELLED" ? `${orderRef(o.id)} cancelled` : `${orderRef(o.id)} updated`, to === "CANCELLED" && o.paymentStatus === "PAID" ? { description: "Payment marked as refunded." } : undefined);
      setCancelling(null);
    } catch (e) {
      toast.error(msg(e));
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] pb-16">
      <PageHeader title="Orders" description="Every order on the platform. Assign drivers and step in when something's stuck." />
      <div className="grid gap-3 px-4 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Filters id="orders" value={f} onChange={select} options={[{ id: "all" as F, label: "All", n: data?.length }, ...FLOW.map((s) => ({ id: s as F, label: s === "PENDING" ? "Waiting for driver" : statusMeta[s].label, n: data?.filter((o) => o.status === s).length }))]} />
          <Search value={q} onChange={setQ} placeholder="Search ref, item or person" />
        </div>
        <Table
          head={["Order", "Customer · farm", "Driver", "Payment", "Total", "Status", ""]}
          minWidth={960}
          loading={isLoading}
          empty={!rows.length && !isLoading ? <EmptyState icon={<Receipt className="size-5" />} title="No orders here" body="Orders with this status will show up here." /> : undefined}
        >
          {rows.map((o) => {
            const m = statusMeta[o.status];
            const pay = paymentMeta[o.paymentStatus];
            const open = o.status !== "DELIVERED" && o.status !== "CANCELLED";
            return (
              <tr key={o.id} className={tr}>
                <td className={td}>
                  <span className="block whitespace-nowrap font-medium">
                    {o.quantity} × {o.productName}
                  </span>
                  <span className="num flex items-center gap-1.5 whitespace-nowrap text-ui-sm text-app-faint">
                    {orderRef(o.id)} · {relDay(o.createdAt)}, {time(o.createdAt)}
                    {o.donationId && <Gift weight="fill" className="size-3 text-[#6B3FA0] dark:text-[#C9A8F0]" aria-label="Donation run" />}
                  </span>
                </td>
                <td className={td + " max-w-48"}>
                  <Link href={`/admin/users?open=${o.customerId}`} className="block truncate hover:underline" title="Open their details to fix an address or phone number">
                    {o.customerName}
                  </Link>
                  <span className="block truncate text-ui-sm text-app-faint">from {o.farmerName}</span>
                </td>
                <td className={td}>
                  {open ? (
                    <select
                      aria-label={`Driver for ${orderRef(o.id)}`}
                      value={o.driverId ?? ""}
                      onChange={(e) => onAssign(o, Number(e.target.value))}
                      className={cn("h-8 max-w-40 rounded-[7px] bg-app-panel px-2 text-ui shadow-[0_0_0_1px_var(--a-line-strong)] outline-none focus:shadow-[0_0_0_1px_var(--a-accent)]", !o.driverId && "text-app-amber")}
                    >
                      {!o.driverId && <option value="">Assign driver…</option>}
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-app-muted">{o.driverName ?? "–"}</span>
                  )}
                </td>
                <td className={td}>
                  <Pill tone={pay.tone}>{o.donationId ? "No charge" : pay.label}</Pill>
                </td>
                <td className={td + " num"}>{o.donationId ? "–" : gbp(o.total)}</td>
                <td className={td}>
                  <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", m.color)}>
                    <m.icon weight="fill" className="size-4" /> <span className="text-app-text">{m.label}</span>
                  </span>
                </td>
                <td className={td + " whitespace-nowrap text-right"}>
                  {NEXT[o.status] && (
                    <Button size="sm" disabled={busy} onClick={() => move(o, NEXT[o.status]!.to)}>
                      {NEXT[o.status]!.label}
                    </Button>
                  )}
                  {open && (
                    <Button size="sm" variant="ghost" className="ml-1 text-app-red" onClick={() => setCancelling(o)}>
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
      <Confirm
        open={!!cancelling}
        title={`Cancel ${cancelling ? orderRef(cancelling.id) : ""}?`}
        body={cancelling?.paymentStatus === "PAID" && !cancelling.donationId ? `${cancelling.customerName} will be refunded ${gbp(cancelling.total)} and told the order won't arrive.` : "Everyone on the order will be told it's cancelled."}
        action="Cancel order"
        danger
        busy={busy}
        onConfirm={() => cancelling && move(cancelling, "CANCELLED")}
        onClose={() => setCancelling(null)}
      />
    </div>
  );
}
