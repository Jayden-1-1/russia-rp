import { NextRequest } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ok, fail } from "@/lib/api";

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (user) await audit(user.id, "auth.logout", "user", user.id);
  await destroySession();
  return ok({ loggedOut: true });
}
