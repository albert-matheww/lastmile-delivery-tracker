import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./jwt";

/**
 * Reads and verifies the session cookie. This is the single source of
 * truth for "who is the caller" — every API route must call this (or
 * requireUser/requireRole below) itself rather than trusting proxy.ts,
 * per Next.js's own guidance that proxy/middleware is not a security
 * boundary on its own.
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("You do not have permission to perform this action", 403);
  }
  return user;
}
