import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Завершить обзвон (после устной беседы): сессия переходит
 * в awaiting_review, и появляется возможность оценивать.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireCapability("results.grade");
    const { sessionId } = await params;
    const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status !== "active") {
      return fail("Завершить можно только активный обзвон", 409);
    }
    // Только взявший проверяющий (или root) может завершить
    if (session.examinerId && session.examinerId !== user.id && !user.isRootAdmin) {
      return fail("Обзвон ведёт другой проверяющий", 403);
    }
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: "awaiting_review", finishedAt: new Date() },
    });
    await audit(user.id, "calls.finish", "call_session", sessionId, "interview ended");
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}
