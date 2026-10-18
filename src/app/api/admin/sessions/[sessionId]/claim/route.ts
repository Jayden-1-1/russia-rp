import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

/** Взять обзвон: проверяющий присоединяется к активной сессии. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireCapability("results.grade");
    const { sessionId } = await params;
    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status !== "active") return fail("Сессия уже не активна", 409);
    if (session.examinerId && session.examinerId !== user.id) {
      return fail("Обзвон уже взял другой проверяющий", 409);
    }
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { examinerId: user.id },
    });
    await audit(user.id, "calls.claim", "call_session", sessionId, "examiner joined");
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}
