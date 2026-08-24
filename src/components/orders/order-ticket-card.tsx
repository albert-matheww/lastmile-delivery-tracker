import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * The list-view signature card: a torn ticket stub. The tracking number
 * and status stamp sit above a perforated divider from the route/price
 * details, echoing a parcel receipt rather than a generic list row.
 */
export function OrderTicketCard({
  href,
  orderNumber,
  routeLabel,
  meta,
  createdAt,
  totalCharge,
  status,
}: {
  href: string;
  orderNumber: string;
  routeLabel: string;
  meta: string;
  createdAt: Date;
  totalCharge: string;
  status: OrderStatus;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-[5px] border-[1.5px] border-line bg-paper-raised px-5 pt-4 transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <p className="font-manifest text-sm font-medium tracking-wide text-ink">{orderNumber}</p>
          <StatusBadge status={status} />
        </div>
        <hr className="stub-divider" />
        <div className="flex flex-wrap items-end justify-between gap-2 pb-4 pt-4">
          <div>
            <p className="text-sm text-ink">{routeLabel}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {meta} &middot; {formatDateTime(createdAt)}
            </p>
          </div>
          <span className="font-manifest text-base font-medium text-ink">
            {formatCurrency(totalCharge)}
          </span>
        </div>
      </div>
    </Link>
  );
}
