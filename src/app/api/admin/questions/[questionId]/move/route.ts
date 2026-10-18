import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const user = await requireCapability("questions.manage");
    const body = (await req.json()) as { dir?: -1 | 1 };
    if (body.dir !== -1 && body.dir !== 1) return fail("dir должен быть -1 или 1");

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return fail("Вопрос не найден", 404);

    const siblings = await prisma.question.findMany({
      where: { templateId: question.templateId },
      orderBy: { order: "asc" },
    });
    const idx = siblings.findIndex((q) => q.id === questionId);
    const target = idx + body.dir;
    if (target < 0 || target >= siblings.length) return ok({ questions: siblings });

    // Меняем местами order
    const a = siblings[idx];
    const b = siblings[target];
    await prisma.$transaction([
      prisma.question.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.question.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    const refreshed = await prisma.question.findMany({
      where: { templateId: question.templateId },
      orderBy: { order: "asc" },
    });
    await audit(user.id, "question.move", "question", questionId, `dir:${body.dir}`);
    return ok({ questions: refreshed });
  } catch (e) {
    return handleAuthError(e);
  }
}
