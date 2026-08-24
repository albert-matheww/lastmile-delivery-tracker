import { prisma } from "@/lib/db/client";
import { getEmailProvider } from "./providers";
import { statusEmail } from "./templates";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Sends (or logs, if no provider is configured) an email to the customer
 * for every status change, and records the attempt in NotificationLog
 * regardless of outcome — a failed send never blocks the status update
 * itself, it's just recorded as FAILED for admins to see.
 */
export async function notifyCustomerOfStatusChange(
  orderId: string,
  status: OrderStatus,
  extra?: { rescheduleDate?: Date | null; failureNote?: string | null }
): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { customer: true },
  });

  const { subject, body } = statusEmail(order.orderNumber, status, extra);
  const provider = getEmailProvider();
  const result = await provider.send(order.customer.email, subject, body);

  await prisma.notificationLog.create({
    data: {
      orderId: order.id,
      channel: "EMAIL",
      recipient: order.customer.email,
      subject,
      body,
      status: result.ok ? "SENT" : "FAILED",
      error: result.ok ? null : result.error,
    },
  });
}
