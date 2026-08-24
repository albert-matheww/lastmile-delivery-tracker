import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { loadOrderForViewer } from "@/lib/orders/access";

export const GET = withApiErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const order = await loadOrderForViewer(id, user);
    return NextResponse.json({ order });
  }
);
