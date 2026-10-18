import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Оценка 2 тура (практика): 6 критериев по 0–2 балла.
 * Максимум 12, проходной 8. Итог окончательный: оба тура пройдены → принят.
 */
export const PRACTICE_CRITERIA = [
  "Выполнение поставленной задачи (объём реализации)",
  "Работоспособность механик (без критических ошибок)",
  "Качество кода: структура, читаемость, отсутствие хардкода",
  "Безопасность: серверные проверки, защита от читов",
  "Оформление: детали, материалы, освещение локации",
  "Самостоятельность и ход выполнения (вопросы, подход)",
];

export const STAGE2_THRESHOLD = 8;
export const STAGE2_MAX = 12;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireCapability("results.grade");
    const body = (await req.json()) as {
      scores?: { criterion: number; score: number }[];
    };

    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: { stageGrades: true, practiceTask: true },
    });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.stage !== 2) return fail("2 тур ещё не запущен", 409);
    if (session.status !== "active") return fail("Сессия не активна", 409);
    if (session.stageGrades.some((g) => g.stage === 2)) {
      return fail("Оценки 2 тура уже сохранены (окончательные)", 409);
    }
    if (!session.practiceTask) return fail("Задание практики не назначено");

    // 6 критериев
    if (!body.scores || body.scores.length !== 6) {
      return fail("Оцените все 6 критериев (0–2 балла)");
    }
    const clean = body.scores.map((s) => ({
      criterion: Math.max(0, Math.min(5, Math.round(s.criterion))),
      score: Math.max(0, Math.min(2, Math.round(s.score))),
    }));
    // Каждый критерий ровно один раз
    const seen = new Set(clean.map((c) => c.criterion));
    if (seen.size !== 6) return fail("Критерии указаны неверно");

    const totalScore = clean.reduce((sum, c) => sum + c.score, 0);
    const passed = totalScore >= STAGE2_THRESHOLD;

    // 1 тур должен быть пройден (проверка целостности)
    const stage1 = session.stageGrades.find((g) => g.stage === 1);
    if (!stage1?.passed) return fail("1 тур не пройден — 2 тур не оценивается", 409);

    await prisma.stageGrade.create({
      data: {
        sessionId,
        stage: 2,
        totalScore,
        maxScore: STAGE2_MAX,
        passed,
        examinerId: user.id,
        details: JSON.stringify(clean),
      },
    });

    // Финальное решение: оба тура пройдены → принят
    const decision = passed ? "approved" : "rejected";
    await prisma.callDecision.create({
      data: {
        sessionId,
        examinerId: user.id,
        decision,
        comment:
          "1 тур: " + stage1.totalScore + "/" + stage1.maxScore +
          ", 2 тур (практика): " + totalScore + "/" + STAGE2_MAX +
          " (порог " + STAGE2_THRESHOLD + ")",
        score: stage1.totalScore + totalScore,
      },
    });
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: "completed", finishedAt: new Date() },
    });
    await prisma.callAssignment.update({
      where: { id: session.assignmentId },
      data: { status: "completed", completedAt: new Date() },
    });
    await audit(user.id, "calls.stage2.grade", "call_session", sessionId, decision + " " + totalScore);
    return ok({
      stage: 2,
      passed,
      score: totalScore,
      message: passed
        ? "Кандидат принят: оба тура пройдены (практика " + totalScore + "/" + STAGE2_MAX + ")"
        : "Кандидат не прошёл практику (" + totalScore + " из " + STAGE2_THRESHOLD + "+)",
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
