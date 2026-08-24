import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { quoteSchema } from "@/lib/validation/schemas";
import { buildQuote } from "@/lib/orders/quote";

// Lets the frontend show the computed charge before the customer
// confirms an order, without creating anything yet.
export const POST = withApiErrors(async (req: Request) => {
  await requireUser();
  const body = quoteSchema.parse(await req.json());
  const quote = await buildQuote(body);
  return NextResponse.json({ quote });
});
