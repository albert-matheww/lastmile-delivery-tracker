import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { assignOrderSchema } from "@/lib/validation/schemas";
import { autoAssignOrder, manuallyAssignOrder } from "@/lib/orders/assign-order";
import { loadOrderForViewer } from "@/lib/orders/access";

export const POST = withApiErrors(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireRole("ADMIN");
    const { id } = await ctx.params;
    const body = assignOrderSchema.parse(await req.json());

    if (body.mode === "auto") {
      await autoAssignOrder(id, { id: user.sub, role: user.role });
    } else {
      await manuallyAssignOrder(id, body.agentId, { id: user.sub, role: user.role });
    }

    const order = await loadOrderForViewer(id, user);
    return NextResponse.json({ order });
  }
);
