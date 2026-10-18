import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";

/** Текущий статус авторизации. */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  return ok({
    authenticated: Boolean(user),
    user: user
      ? {
          login: user.login,
          displayName: user.displayName,
          position: user.position,
          isRootAdmin: user.isRootAdmin,
          roles: user.roles.map((r) => r.name),
        }
      : null,
  });
}
