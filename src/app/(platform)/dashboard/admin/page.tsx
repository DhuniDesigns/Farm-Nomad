"use client";

import Link from "next/link";
import { ArrowRight, CalendarX, CheckCircle, SealCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import { useAllDonationsAdminQuery, useListOrdersAdminQuery, useListOrganisationsQuery, useListProductsQuery, useListUsersQuery } from "@/lib/api/farmnomad";
import { daysUntil, type OrderStatus, type Role } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { RoleBadge, roleLabel } from "@/components/app/admin/parts";
import { statusMeta } from "@/components/app/orderMeta";
import { Avatar, Skeleton, gbp, orderRef, relDay, time } from "@/components/app/ui";
import { cn } from "@/lib/cn";

const DAY = 86400000;
const ROLES: Role[] = ["CUSTOMER", "FARMER", "DRIVER", "ORGANISATION", "KITCHEN"];
const FLOW: OrderStatus[] = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

/** Admin overview (spec §7.4 /dashboard/admin): the platform at a glance, and what needs a person. */
export default function AdminOverview() {
  const { data: users } = useListUsersQuery();
  const { data: orders } = useListOrdersAdminQuery();
  const { data: orgs } = useListOrganisationsQuery();
  const { data: products } = useListProductsQuery();
  const { data: donations } = useAllDonationsAdminQuery();

  const now = Date.now();
  const paid = orders?.filter((o) => o.paymentStatus === "PAID") ?? [];
  const sales30 = paid.filter((o) => now - +new Date(o.createdAt) < 30 * DAY).reduce((s, o) => s + o.total, 0);
  const today = orders?.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length ?? 0;
  const newUsers = users?.filter((u) => u.createdAt && now - +new Date(u.createdAt) < 7 * DAY).length ?? 0;
  const rescued = donations?.filter((d) => d.status !== "PENDING").reduce((s, d) => s + d.quantity, 0) ?? 0;

  const waitingOrgs = orgs?.filter((o) => o.verificationLevel === "PENDING") ?? [];
  const noDriver = orders?.filter((o) => o.status === "PENDING" && !o.driverId && o.paymentStatus === "PAID") ?? [];
  const stale = products?.filter((p) => p.bestBeforeDate && daysUntil(p.bestBeforeDate) < 0) ?? [];
  const attention = [
    { n: waitingOrgs.length, icon: SealCheck, title: "organisations waiting for verification", href: "/admin/verifications", cta: "Review" },
    { n: noDriver.length, icon: Truck, title: "paid orders with no driver yet", href: "/admin/orders?status=PENDING", cta: "Assign" },
    { n: stale.length, icon: CalendarX, title: "listings past their best-before date", href: "/admin/listings?f=past", cta: "Check" },
  ].filter((a) => a.n > 0);

  const ready = users && orders && orgs && products && donations;

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      <PageHeader title="Overview" description="Everything happening on FarmNomad, and what needs a person." />
      <div className="grid gap-6 px-4 md:px-8">
        <dl className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <Stat label="Sales, last 30 days" value={orders ? gbp(sales30) : null} sub={orders ? `${paid.length} paid orders` : undefined} />
          <Stat label="Orders today" value={orders ? String(today) : null} sub={orders ? `${orders.filter((o) => ["PENDING", "ASSIGNED", "IN_TRANSIT"].includes(o.status)).length} in progress` : undefined} />
          <Stat label="People on FarmNomad" value={users ? String(users.length) : null} sub={users ? `${newUsers} joined this week` : undefined} />
          <Stat label="Units of food rescued" value={donations ? String(rescued) : null} sub="Claimed donations" />
        </dl>

        <section aria-labelledby="attn">
          <h2 id="attn" className="mb-3 font-medium">
            Needs attention
          </h2>
          {!ready ? (
            <Skeleton className="h-28 rounded-xl" />
          ) : attention.length ? (
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {attention.map((a) => (
                <li key={a.title}>
                  <Link href={a.href} className="group flex items-center gap-3 border-b border-app-line px-5 py-3.5 transition-colors last:border-0 hover:bg-app-hover">
                    <span className="grid size-8 place-items-center rounded-lg bg-app-amber-soft text-app-amber">
                      <a.icon weight="fill" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="num font-medium">{a.n}</span> {a.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-ui-sm font-medium text-app-accent">
                      {a.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 rounded-xl p-5 text-app-muted shadow-[0_0_0_1px_var(--a-line)]">
              <CheckCircle weight="fill" className="size-4 text-app-accent" /> Nothing waiting. Every order has a driver and every group has been reviewed.
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Bars
            title="People by role"
            href="/admin/users"
            rows={ROLES.map((r) => ({ label: roleLabel[r], n: users?.filter((u) => u.role === r).length ?? 0 }))}
            loading={!users}
          />
          <Bars
            title="Orders by status"
            href="/admin/orders"
            rows={FLOW.map((s) => ({ label: statusMeta[s].label, n: orders?.filter((o) => o.status === s).length ?? 0 }))}
            loading={!orders}
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section aria-labelledby="recent">
            <Head id="recent" title="Latest orders" href="/admin/orders" />
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {orders?.slice(0, 6).map((o) => {
                const m = statusMeta[o.status];
                return (
                  <li key={o.id} className="flex items-center gap-3 border-b border-app-line px-5 py-3 last:border-0">
                    <m.icon weight="fill" className={cn("size-4 shrink-0", m.color)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {o.quantity} × {o.productName}
                      </span>
                      <span className="block truncate text-ui-sm text-app-faint">
                        {o.customerName} · {o.farmerName}
                      </span>
                    </span>
                    <span className="num hidden text-ui-sm text-app-faint sm:block">{orderRef(o.id)}</span>
                    <span className="num w-16 text-right">{gbp(o.total)}</span>
                  </li>
                );
              }) ?? (
                <li className="p-4">
                  <Skeleton className="h-40" />
                </li>
              )}
            </ul>
          </section>
          <section aria-labelledby="joined">
            <Head id="joined" title="Newest people" href="/admin/users" />
            <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
              {users?.slice(0, 6).map((u) => (
                <li key={u.id} className="flex items-center gap-3 border-b border-app-line px-5 py-3 last:border-0">
                  <Avatar name={u.fullName} className="size-7 text-[10px]" />
                  <span className="min-w-0 flex-1 truncate font-medium">{u.fullName}</span>
                  <RoleBadge role={u.role} />
                  <span className="num hidden w-24 text-right text-ui-sm text-app-faint sm:block">{u.createdAt ? `${relDay(u.createdAt)}${relDay(u.createdAt) === "Today" ? `, ${time(u.createdAt)}` : ""}` : ""}</span>
                </li>
              )) ?? (
                <li className="p-4">
                  <Skeleton className="h-40" />
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div className="rounded-xl p-4 shadow-[0_0_0_1px_var(--a-line)]">
      <dt className="text-ui-sm text-app-muted">{label}</dt>
      <dd className="num mt-2 font-display text-[28px] font-medium leading-none tracking-[-0.03em]">{value === null ? <Skeleton className="h-7 w-16" /> : value}</dd>
      {sub && <p className="mt-2 text-ui-sm text-app-faint">{sub}</p>}
    </div>
  );
}

function Head({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 id={id} className="font-medium">
        {title}
      </h2>
      <Link href={href} className="inline-flex items-center gap-1 text-ui-sm font-medium text-app-accent hover:underline">
        See all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/** Ranked bars: one hue, direct labels, the number at the end of each bar. */
function Bars({ title, href, rows, loading }: { title: string; href: string; rows: { label: string; n: number }[]; loading?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="rounded-xl p-5 shadow-[0_0_0_1px_var(--a-line)]" aria-label={title}>
      <Head id={title} title={title} href={href} />
      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <ul className="grid gap-2.5">
          {rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[96px_minmax(0,1fr)_32px] items-center gap-3 text-ui-sm">
              <span className="truncate text-app-muted">{r.label}</span>
              <span className="h-2 rounded-full bg-app-hover">
                <span className="block h-full rounded-full bg-app-accent transition-[width] duration-500 ease-out" style={{ width: `${(r.n / max) * 100}%` }} />
              </span>
              <span className="num text-right font-medium">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
