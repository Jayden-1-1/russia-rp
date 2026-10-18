import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleAuthError } from "@/lib/api";

/** Состояние обзвона кандидата: этапы, результаты, практика. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const user = await requireCapability("calls.take");
    const assignment = await prisma.callAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        sessions: {
          where: { status: { in: ["active", "awaiting_review", "completed"] } },
          include: {
            examiner: { select: { login: true } },
            practiceTask: true,
            stageGrades: true,
          },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
        template: { select: { category: true } },
      },
    });
    if (!assignment || assignment.userId !== user.id) {
      return fail("Назначение не найдено", 404);
    }
    const session = assignment.sessions[0];
    if (!session) return ok({ session: null, category: assignment.template.category });

    const stage1 = session.stageGrades.find((g) => g.stage === 1);
    const stage2 = session.stageGrades.find((g) => g.stage === 2);

    return ok({
      category: assignment.template.category,
      session: {
        id: session.id,
        status: session.status,
        stage: session.stage,
        examiner: session.examiner ? session.examiner.login : null,
        stage1: stage1
          ? { score: stage1.totalScore, max: stage1.maxScore, passed: stage1.passed }
          : null,
        stage2: stage2
          ? { score: stage2.totalScore, max: stage2.maxScore, passed: stage2.passed }
          : null,
        practice: session.practiceTask && session.stage >= 2
          ? {
              title: session.practiceTask.title,
              brief: session.practiceTask.brief,
              requirements: session.practiceTask.requirements,
              deadline: session.practiceDeadlineAt?.toISOString() ?? null,
            }
          : null,
      },
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
