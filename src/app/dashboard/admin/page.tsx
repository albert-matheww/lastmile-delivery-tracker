import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

const STATUSES: OrderStatus[] = [
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RESCHEDULED",
];

const selectClass =
  "h-9 rounded-[3px] border-[1.5px] border-line bg-paper-raised px-2 text-ink";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; zoneId?: string; agentId?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (sp.status && STATUSES.includes(sp.status as OrderStatus)) {
    where.currentStatus = sp.status as OrderStatus;
  }
  if (sp.zoneId) where.OR = [{ pickupZoneId: sp.zoneId }, { dropZoneId: sp.zoneId }];
  if (sp.agentId) where.assignedAgentId = sp.agentId;

  const [orders, zones, agents] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { name: true } },
        pickupZone: { select: { name: true } },
        dropZone: { select: { name: true } },
        assignedAgent: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
    prisma.agent.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">All Orders</h1>
          <p className="text-sm text-ink-soft">{orders.length} shown</p>
        </div>
        <form className="flex flex-wrap gap-2 text-sm" action="/dashboard/admin">
          <select name="status" defaultValue={sp.status ?? ""} className={selectClass}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="zoneId" defaultValue={sp.zoneId ?? ""} className={selectClass}>
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <select name="agentId" defaultValue={sp.agentId ?? ""} className={selectClass}>
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.user.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-[3px] border-[1.5px] border-ink/70 bg-paper-raised px-3 font-display text-xs font-semibold uppercase tracking-wide text-ink hover:bg-white"
          >
            Apply
          </button>
          <Link
            href="/dashboard/admin"
            className="flex h-9 items-center px-2 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink"
          >
            Clear
          </Link>
        </form>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted">No orders match these filters.</CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[5px] border-[1.5px] border-line bg-paper-raised">
          <table className="w-full text-sm">
            <thead className="border-b-[1.5px] border-line bg-paper text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              <tr>
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Agent</th>
                <th className="px-4 py-2.5">Charge</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/dashboard/admin/orders/${order.id}`}
                      className="font-manifest text-route hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{order.customer.name}</td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {order.pickupZone.name} → {order.dropZone.name}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {order.assignedAgent?.user.name ?? "—"}
                  </td>
                  <td className="font-manifest px-4 py-2.5 text-ink">
                    {formatCurrency(order.totalCharge.toString())}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.currentStatus} />
                  </td>
                  <td className="font-manifest px-4 py-2.5 text-xs text-ink-soft">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
