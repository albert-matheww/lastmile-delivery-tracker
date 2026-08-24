import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { withApiErrors } from "@/lib/api/handler";
import { registerSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

// Public registration always creates CUSTOMER accounts. Agent and admin
// accounts are provisioned by an admin (see /api/admin/agents) or the
// seed script — there is no self-serve path to elevated roles.
export const POST = withApiErrors(async (req: Request) => {
  const body = registerSchema.parse(await req.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const token = signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  setSessionCookie(res, token);
  return res;
});
