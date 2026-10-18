import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function handleAuthError(e: unknown) {
  if (e instanceof AuthError) {
    return fail(e.code, e.status);
  }
  console.error(e);
  return fail("Внутренняя ошибка сервера", 500);
}
