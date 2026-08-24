import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { rescheduleSchema } from "@/lib/validation/schemas";
import { rescheduleOrder } from "@/lib/orders/reschedule";
import { loadOrderForViewer } from "@/lib/orders/access";

export const POST = withApiErrors(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = rescheduleSchema.parse(await req.json());

    await rescheduleOrder(id, body.newDate, { id: user.sub, role: user.role });

    const order = await loadOrderForViewer(id, user);
    return NextResponse.json({ order });
  }
);
