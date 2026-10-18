import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Итог обзвона для кандидата: решение и баллы.
 * Кандидат видит ТОЛЬКО свой результат — без вопросов и деталей проверки.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const user = await requireCapability("calls.take");

    const assignment = await prisma.callAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        sessions: {
          where: { status: "completed" },
          include: { decisions: true },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });
    if (!assignment || assignment.userId !== user.id) {
      return fail("Назначение не найдено", 404);
    }
    const session = assignment.sessions[0];
    if (!session || session.decisions.length === 0) {
      return ok({ decision: null, score: null });
    }
    const d = session.decisions[0];
    return ok({
      decision: d.decision, // approved | rejected | revision
      score: d.score,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
