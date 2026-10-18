import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Запуск этапа 2 (практики): задание выбирается СЛУЧАЙНО из активных,
 * таймер 60 минут. Запускает проводящий после присоединения.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireCapability("results.grade");
    const { sessionId } = await params;
    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: { assignment: { include: { template: true } } },
    });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status !== "active") return fail("Сессия не активна", 409);
    if (session.assignment.template.category !== "builder") {
      return fail("Практика доступна только для билдеров-скриптеров");
    }
    if (session.stage >= 2 && session.practiceStartedAt) {
      return fail("Этап 2 уже запущен", 409);
    }

    // Случайное задание
    const tasks = await prisma.practiceTask.findMany({
      where: { isActive: true, category: "builder" },
    });
    if (tasks.length === 0) {
      return fail("Нет активных практических заданий");
    }
    const task = tasks[Math.floor(Math.random() * tasks.length)];

    const now = new Date();
    const deadline = new Date(now.getTime() + task.timeLimitMin * 60 * 1000);

    await prisma.callSession.update({
      where: { id: sessionId },
      data: {
        stage: 2,
        practiceTaskId: task.id,
        practiceStartedAt: now,
        practiceDeadlineAt: deadline,
        examinerId: session.examinerId ?? user.id,
      },
    });
    await audit(user.id, "calls.stage2.start", "call_session", sessionId, task.name);
    return ok({ taskId: task.id, deadline: deadline.toISOString() });
  } catch (e) {
    return handleAuthError(e);
  }
}
