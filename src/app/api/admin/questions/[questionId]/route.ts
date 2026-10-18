import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

const TYPES = ["yes_no", "short_text", "long_text"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const user = await requireCapability("questions.manage");
    const body = (await req.json()) as {
      text?: string;
      type?: string;
      timeLimitSec?: number;
      required?: boolean;
      points?: number;
      criteria?: string | null;
      category?: string | null;
    };

    if (body.type && !TYPES.includes(body.type)) return fail("Недопустимый тип вопроса");
    if (body.text !== undefined && body.text.length > 2000) return fail("Вопрос слишком длинный");
    if (body.timeLimitSec !== undefined && (body.timeLimitSec < 0 || body.timeLimitSec > 3600)) {
      return fail("Лимит времени: 0–3600 сек");
    }
    if (body.points !== undefined && (body.points < 0 || body.points > 100)) {
      return fail("Баллы: 0–100");
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(body.text !== undefined ? { text: body.text.trim() } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.timeLimitSec !== undefined ? { timeLimitSec: Math.round(body.timeLimitSec) } : {}),
        ...(body.required !== undefined ? { required: body.required } : {}),
        ...(body.points !== undefined ? { points: Math.round(body.points) } : {}),
        ...(body.criteria !== undefined ? { criteria: body.criteria } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      },
    });
    await audit(user.id, "question.update", "question", questionId);
    return ok({ question });
  } catch (e) {
    return handleAuthError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const user = await requireCapability("questions.manage");
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return fail("Вопрос не найден", 404);

    await prisma.question.delete({ where: { id: questionId } });
    // Перенумерация оставшихся вопросов шаблона
    const remaining = await prisma.question.findMany({
      where: { templateId: question.templateId },
      orderBy: { order: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i + 1) {
        await prisma.question.update({
          where: { id: remaining[i].id },
          data: { order: i + 1 },
        });
      }
    }
    await audit(user.id, "question.delete", "question", questionId);
    return ok({ deleted: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
