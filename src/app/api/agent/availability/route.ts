import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";

const bodySchema = z.object({
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]),
});

// Lets a logged-in agent toggle their own availability, which feeds
// directly into the auto-assignment pool.
export const PATCH = withApiErrors(async (req: Request) => {
  const user = await requireRole("AGENT");
  const body = bodySchema.parse(await req.json());

  const agent = await prisma.agent.findUnique({ where: { userId: user.sub } });
  if (!agent) throw new AppError("Agent profile not found.", 404);

  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data: { availability: body.availability },
  });

  return NextResponse.json({ agent: updated });
});
