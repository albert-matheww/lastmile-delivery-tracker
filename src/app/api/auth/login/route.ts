import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { withApiErrors } from "@/lib/api/handler";
import { loginSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

export const POST = withApiErrors(async (req: Request) => {
  const body = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401);
  }

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
