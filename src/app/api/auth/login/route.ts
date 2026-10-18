import { NextRequest } from "next/server";
import { ensureRootAdmin, login, LoginError } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

/** Вход по логину и паролю. */
export async function POST(req: NextRequest) {
  try {
    await ensureRootAdmin();
    const body = (await req.json()) as { login?: string; password?: string };
    if (!body.login || !body.password) {
      return fail("Укажите логин и пароль");
    }
    const userId = await login(body.login, body.password);
    return ok({ userId });
  } catch (e) {
    if (e instanceof LoginError) {
      return fail(
        e.reason === "INACTIVE" ? "Аккаунт деактивирован" : "Неверный логин или пароль",
        401
      );
    }
    throw e;
  }
}
