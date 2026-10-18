import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";
import { computeGrading, PASS_THRESHOLD } from "@/lib/calls";

/**
 * Оценка 1 тура — ВОВРЕМЯ обзвона (сессия активна): проверяющий задал вопросы,
 * сразу выставил 0–2 за каждый и сохранил. Дальше:
 *  - правила RP: >= 25 → принят, сессия завершена; < 25 → отклонён.
 *  - билдер-скриптер: >= 25 → у кандидата появляется «Перейти ко 2 туру».
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireCapability("results.grade");
    const body = (await req.json()) as {
      scores?: { questionId: string; score: number }[];
    };

    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: {
        template: { include: { questions: true } },
        stageGrades: true,
        assignment: { include: { user: true } },
      },
    });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status !== "active") {
      return fail("Оценка доступна только во время активного обзвона", 409);
    }
    // Оценка 1 тура одна и окончательная
    if (session.stageGrades.some((g) => g.stage === 1)) {
      return fail("Оценки 1 тура уже сохранены (окончательные)", 409);
    }
    if (session.stage !== 1) {
      return fail("1 тур уже пройден — оценивается практика", 409);
    }

    const questions = session.template.questions;
    if (!body.scores || body.scores.length === 0) return fail("Укажите оценки");

    const validIds = new Set(questions.map((q) => q.id));
    const clean = new Map<string, number>();
    for (const s of body.scores) {
      if (validIds.has(s.questionId)) {
        clean.set(s.questionId, Math.max(0, Math.min(2, Math.round(s.score))));
      }
    }
    if (clean.size !== questions.length) {
      return fail(
        "Оценки указаны не для всех вопросов (" + clean.size + "/" + questions.length + ")"
      );
    }

    const allScores = [...clean.entries()].map(([questionId, score]) => ({
      questionId,
      score,
    }));
    const { totalScore, passed } = computeGrading(allScores);
    const isBuilder = session.template.category === "builder";

    // Сохраняем оценки в ответы (статусы)
    for (const a of await prisma.answer.findMany({ where: { sessionId } })) {
      const score = clean.get(a.questionId);
      if (score !== undefined) {
        await prisma.answer.update({
          where: { id: a.id },
          data: {
            status: "answered",
            text: score === 2 ? "Полный ответ" : score === 1 ? "Частичный ответ" : "Нет ответа",
            answeredAt: new Date(),
          },
        });
      }
    }

    // Итоговая оценка 1 тура (окончательная)
    await prisma.stageGrade.create({
      data: {
        sessionId,
        stage: 1,
        totalScore,
        maxScore: questions.length * 2,
        passed,
        examinerId: user.id,
        details: JSON.stringify(allScores),
      },
    });

    const category = session.template.category;

    if (isBuilder && passed) {
      // Билдер прошёл 1 тур → кандидат переходит ко 2 туру сам
      await audit(user.id, "calls.stage1.grade", "call_session", sessionId, totalScore + " (passed)");
      return ok({
        stage: 1,
        passed: true,
        score: totalScore,
        next: "stage2",
        message: "Кандидат прошёл 1 тур (" + totalScore + " баллов). У него появилась кнопка «Перейти ко 2 туру».",
      });
    }

    // Правила или билдер не прошёл → финальное решение
    const decision = passed ? "approved" : "rejected";
    await prisma.callDecision.create({
      data: {
        sessionId,
        examinerId: user.id,
        decision,
        comment:
          "1 тур: " + totalScore + " из " + PASS_THRESHOLD + "+ баллов" +
          (category === "builder" ? " (практика не назначена)" : ""),
        score: totalScore,
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
    await audit(user.id, "calls.stage1.grade", "call_session", sessionId, decision + " " + totalScore);
    return ok({
      stage: 1,
      passed,
      score: totalScore,
      next: "final",
      message: passed
        ? "Кандидат принят (" + totalScore + " баллов)"
        : "Кандидат не прошёл 1 тур (" + totalScore + " из " + PASS_THRESHOLD + "+)",
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
