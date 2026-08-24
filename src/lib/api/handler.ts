import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";

type RouteHandler = (...args: never[]) => Promise<NextResponse>;

/**
 * Wraps a route handler so every thrown AppError/AuthError/ZodError
 * becomes a consistent JSON error response instead of a raw 500. Keeps
 * individual route handlers free of repetitive try/catch blocks.
 */
export function withApiErrors<H extends RouteHandler>(handler: H): H {
  return (async (...args: Parameters<H>) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError || err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: err.flatten() },
          { status: 422 }
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }) as H;
}
