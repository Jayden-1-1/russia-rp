import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";
import { computeGrading, PASS_THRESHOLD } from "@/lib/calls";

/**
 * Решение по результатам. Проверяющий задаёт вопросы устно и оценивает каждый 0–2.
 * Сайт сам суммирует баллы и решает: >= 25 — принят.
 * scores: [{ questionId, score: 0-2 }] — по ВСЕМ вопросам сессии.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireCapability("results.grade");
    const body = (await req.json()) as {
      decision: string;
      comment?: string;
      score?: number;
      scores?: { questionId: string; score: number }[];
    };

    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: {
        template: { include: { questions: true } },
        answers: true,
      },
    });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status !== "awaiting_review") {
      return fail("Решение доступно только после завершения сессии", 409);
    }

    // Идемпотентность: одно решение на сессию
    const existing = await prisma.callDecision.findFirst({ where: { sessionId } });
    if (existing) return fail("Решение уже принято", 409);

    let finalDecision: string;
    let finalScore: number;

    if (body.decision === "auto") {
      if (!body.scores || !Array.isArray(body.scores) || body.scores.length === 0) {
        return fail("Укажите оценки (scores)");
      }

      // Все вопросы варианта — оценка нужна по каждому
      const questions = session.template.questions;
      const validIds = new Set(questions.map((q) => q.id));
      const clean = new Map<string, number>();
      for (const s of body.scores) {
        if (validIds.has(s.questionId)) {
          clean.set(s.questionId, Math.max(0, Math.min(2, Math.round(s.score))));
        }
      }
      if (clean.size !== questions.length) {
        return fail(
          "Оценки указаны не для всех вопросов (" +
            clean.size +
            "/" +
            questions.length +
            ")"
        );
      }

      // Сначала считаем итог (до бэкфилла, который мутирует clean)
      const allScores = [...clean.entries()].map(([questionId, score]) => ({
        questionId,
        score,
      }));
      const { totalScore, passed } = computeGrading(allScores);

      // Сохраняем оценки и статус в заготовки ответов (бэкфилл для старых сессий)
      for (const a of session.answers) {
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
          clean.delete(a.questionId);
        }
      }
      // Ответов может не быть (старые сессии) — создаём
      for (const [questionId, score] of clean) {
        const q = questions.find((x) => x.id === questionId);
        await prisma.answer.create({
          data: {
            sessionId,
            questionId,
            order: q?.order ?? 0,
            status: "answered",
            text: score === 2 ? "Полный ответ" : score === 1 ? "Частичный ответ" : "Нет ответа",
            answeredAt: new Date(),
          },
        });
      }

      finalDecision = passed ? "approved" : "rejected";
      finalScore = totalScore;
    } else {
      if (!["approved", "rejected", "revision"].includes(body.decision)) {
        return fail("Недопустимое решение");
      }
      finalDecision = body.decision;
      finalScore = body.score ?? 0;
    }

    await prisma.callDecision.create({
      data: {
        sessionId,
        examinerId: user.id,
        decision: finalDecision,
        comment:
          body.comment ??
          (body.decision === "auto"
            ? `Автоматическая проверка: ${finalScore} из ${PASS_THRESHOLD}+ баллов`
            : null),
        score: finalScore,
      },
    });
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });
    await prisma.callAssignment.update({
      where: { id: session.assignmentId },
      data: { status: "completed", completedAt: new Date() },
    });
    await audit(
      user.id,
      "calls.decision",
      "call_session",
      sessionId,
      finalDecision + " score:" + finalScore
    );
    return ok({
      passed: finalDecision === "approved",
      score: finalScore,
      decision: finalDecision,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
