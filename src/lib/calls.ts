/**
 * Бизнес-логика обзвонов.
 * Таймеры работают на сервере: deadlineAt фиксируется в БД при старте вопроса.
 */

import { prisma } from "@/lib/db";

export type QuestionType = "yes_no" | "short_text" | "long_text";

export const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: "yes_no", label: "Да / Нет" },
  { id: "short_text", label: "Короткий текстовый ответ" },
  { id: "long_text", label: "Развёрнутый текстовый ответ" },
];

export interface CurrentQuestion {
  session: {
    id: string;
    status: string;
    startedAt: string;
  };
  question: {
    id: string;
    order: number;
    text: string;
    type: QuestionType;
    timeLimitSec: number;
    required: boolean;
    points: number;
    criteria: string | null;
    category: string | null;
  };
  answer: {
    id: string;
    status: string;
    deadlineAt: string | null;
    remainingSec: number | null;
    text: string | null;
    boolValue: boolean | null;
  };
  progress: { current: number; total: number };
}

/**
 * Возвращает текущий вопрос сессии. Если время истекло — сервер сам
 * применяет правило (пропуск) до отдачи состояния клиенту.
 */
export async function getCurrentQuestion(sessionId: string): Promise<CurrentQuestion | null> {
  const session = await prisma.callSession.findUnique({
    where: { id: sessionId },
    include: {
      assignment: { include: { template: { include: { questions: true } } } },
      answers: true,
    },
  });
  if (!session) return null;
  if (session.status === "completed" || session.status === "cancelled") return null;

  const questions = session.assignment.template.questions.sort((a, b) => a.order - b.order);
  const total = questions.length;

  // Проверяем дедлайн активного ответа (серверное время!)
  for (const answer of session.answers) {
    if (answer.status === "pending" && answer.deadlineAt && answer.deadlineAt < new Date()) {
      await prisma.answer.update({
        where: { id: answer.id },
        data: { status: "timed_out", skippedAt: new Date() },
      });
      await advanceSession(session.id);
      return getCurrentQuestion(session.id); // рекурсивно — уже с новым состоянием
    }
  }

  // Находим первый вопрос без ответа
  const answered = new Set(session.answers.map((a) => a.questionId));
  const question = questions.find((q) => !answered.has(q.id));
  if (!question) {
    // Все вопросы пройдены
    await prisma.callSession.update({
      where: { id: session.id },
      data: { status: "awaiting_review", finishedAt: new Date() },
    });
    return null;
  }

  let answer = session.answers.find((a) => a.questionId === question.id);
  if (!answer) {
    // Стартуем таймер серверно
    const startedAt = new Date();
    const deadlineAt = question.timeLimitSec
      ? new Date(startedAt.getTime() + question.timeLimitSec * 1000)
      : null;
    answer = await prisma.answer.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        order: question.order,
        status: "pending",
        startedAt,
        deadlineAt,
      },
    });
  }

  const remainingSec = answer.deadlineAt
    ? Math.max(0, Math.ceil((answer.deadlineAt.getTime() - Date.now()) / 1000))
    : null;

  return {
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
    },
    question: {
      id: question.id,
      order: question.order,
      text: question.text,
      type: question.type as QuestionType,
      timeLimitSec: question.timeLimitSec,
      required: question.required,
      points: question.points,
      criteria: question.criteria,
      category: question.category,
    },
    answer: {
      id: answer.id,
      status: answer.status,
      deadlineAt: answer.deadlineAt?.toISOString() ?? null,
      remainingSec,
      text: answer.text,
      boolValue: answer.boolValue,
    },
    progress: { current: question.order, total },
  };
}

async function advanceSession(sessionId: string) {
  const session = await prisma.callSession.findUnique({
    where: { id: sessionId },
    include: {
      assignment: { include: { template: { include: { questions: true } } } },
      answers: true,
    },
  });
  if (!session) return;
  const questions = session.assignment.template.questions;
  const answered = new Set(session.answers.map((a) => a.questionId));
  const next = questions.find((q) => !answered.has(q.id));
  if (!next) {
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: "awaiting_review", finishedAt: new Date() },
    });
  } else {
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { currentOrder: next.order },
    });
  }
}

/**
 * Фиксирует ответ. Защита от повторной отправки и от ответа после дедлайна:
 * ответ принимается только если pending и не истёк серверный дедлайн.
 */
export async function submitAnswer(
  sessionId: string,
  answerId: string,
  payload: { text?: string; boolValue?: boolean }
): Promise<{ accepted: boolean; reason?: string; next: CurrentQuestion | null; finished: boolean }> {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });
  if (!answer || answer.sessionId !== sessionId) {
    return { accepted: false, reason: "Ответ не найден", next: null, finished: false };
  }
  if (answer.status !== "pending") {
    return { accepted: false, reason: "Ответ уже отправлен", next: null, finished: false };
  }
  if (answer.deadlineAt && answer.deadlineAt < new Date()) {
    await prisma.answer.update({
      where: { id: answerId },
      data: { status: "timed_out", skippedAt: new Date() },
    });
    await advanceSession(sessionId);
    const next = await getCurrentQuestion(sessionId);
    return { accepted: false, reason: "Время истекло", next, finished: !next };
  }

  const q = answer.question;
  if (q.type === "yes_no" && typeof payload.boolValue !== "boolean") {
    return { accepted: false, reason: "Ожидается Да/Нет", next: null, finished: false };
  }
  if (q.type !== "yes_no") {
    const text = (payload.text ?? "").trim();
    if (q.required && !text) {
      return { accepted: false, reason: "Ответ обязателен", next: null, finished: false };
    }
  }

  await prisma.answer.update({
    where: { id: answerId },
    data: {
      status: "answered",
      text: q.type === "yes_no" ? null : (payload.text ?? "").trim() || null,
      boolValue: q.type === "yes_no" ? payload.boolValue! : null,
      answeredAt: new Date(),
    },
  });
  await advanceSession(sessionId);
  const next = await getCurrentQuestion(sessionId);
  return { accepted: true, next, finished: !next };
}

/** Явный пропуск вопроса кандидатом (только пока не истёк дедлайн). */
export async function skipAnswer(sessionId: string, answerId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer || answer.sessionId !== sessionId || answer.status !== "pending") {
    return { accepted: false, reason: "Пропуск невозможен", next: null, finished: false };
  }
  await prisma.answer.update({
    where: { id: answerId },
    data: { status: "skipped", skippedAt: new Date() },
  });
  await advanceSession(sessionId);
  const next = await getCurrentQuestion(sessionId);
  return { accepted: true, next, finished: !next };
}

/** Начать сессию обзвона для назначения. */
export async function startSession(assignmentId: string, examinerId: string | null) {
  const assignment = await prisma.callAssignment.findUnique({
    where: { id: assignmentId },
    include: { template: { include: { questions: true } }, sessions: true },
  });
  if (!assignment || assignment.status !== "assigned") {
    throw new Error("Назначение не доступно для запуска");
  }
  const running = assignment.sessions.find(
    (s) => s.status === "active" || s.status === "awaiting_review"
  );
  if (running) return running; // идемпотентность: повторный старт не создаёт дубль

  const questions = [...assignment.template.questions].sort((a, b) => a.order - b.order);

  return prisma.callSession.create({
    data: {
      assignmentId,
      templateId: assignment.templateId,
      examinerId,
      status: "active",
      // Заготовки ответов: проверяющий заполняет их в ходе устной беседы
      answers: {
        create: questions.map((q) => ({
          questionId: q.id,
          order: q.order,
          status: "pending",
        })),
      },
    },
  });
}

// ---------- Проверка ответов и автоматическое решение ----------

export const PASS_THRESHOLD = 25; // проходной балл

/**
 * Выставляет оценки администратора (0–2 балла за вопрос), суммирует
 * и вычисляет автоматическое решение: >= PASS_THRESHOLD баллов — принят.
 */
export function computeGrading(
  scores: { questionId: string; score: number }[]
): { totalScore: number; passed: boolean } {
  const totalScore = scores.reduce(
    (sum, s) => sum + Math.max(0, Math.min(2, Math.round(s.score))),
    0
  );
  return { totalScore, passed: totalScore >= PASS_THRESHOLD };
}

