import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Кандидат (билдер-скриптер, прошедший 1 тур) переходит ко 2 туру:
 * случайное задание + таймер 1 час запускаются сразу по нажатию.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const user = await requireCapability("calls.take");
    if (user.isRootAdmin) return fail("Администрация не проходит обзвоны", 403);

    const assignment = await prisma.callAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        sessions: { where: { status: "active" }, take: 1, include: { stageGrades: true } },
        template: { select: { category: true } },
      },
    });
    if (!assignment || assignment.userId !== user.id) {
      return fail("Назначение не найдено", 404);
    }
    const session = assignment.sessions[0];
    if (!session) return fail("Нет активной сессии", 409);
    if (assignment.template.category !== "builder") {
      return fail("Практика доступна только для направления «Билдер-скриптер»");
    }

    // 1 тур должен быть пройден
    const stage1 = session.stageGrades.find((g) => g.stage === 1);
    if (!stage1) return fail("Оценки 1 тура ещё не сохранены", 409);
    if (!stage1.passed) return fail("1 тур не пройден", 409);

    if (session.stage >= 2 && session.practiceStartedAt) {
      return fail("2 тур уже запущен", 409);
    }

    // Случайное задание
    const tasks = await prisma.practiceTask.findMany({
      where: { isActive: true, category: "builder" },
    });
    if (tasks.length === 0) return fail("Нет активных практических заданий");
    const task = tasks[Math.floor(Math.random() * tasks.length)];

    const now = new Date();
    const deadline = new Date(now.getTime() + task.timeLimitMin * 60 * 1000);

    await prisma.callSession.update({
      where: { id: session.id },
      data: {
        stage: 2,
        practiceTaskId: task.id,
        practiceStartedAt: now,
        practiceDeadlineAt: deadline,
      },
    });
    return ok({ deadline: deadline.toISOString() });
  } catch (e) {
    return handleAuthError(e);
  }
}
