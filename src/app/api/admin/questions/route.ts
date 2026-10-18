import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("questions.manage");
    const body = (await req.json()) as { templateId?: string };
    if (!body.templateId) return fail("Укажите templateId");

    const template = await prisma.callTemplate.findUnique({
      where: { id: body.templateId },
      include: { _count: { select: { questions: true } } },
    });
    if (!template) return fail("Шаблон не найден", 404);

    const order = template._count.questions + 1;
    const question = await prisma.question.create({
      data: {
        templateId: body.templateId,
        order,
        text: "",
        type: "short_text",
      },
    });
    await audit(user.id, "question.create", "question", question.id);
    return ok({ question });
  } catch (e) {
    return handleAuthError(e);
  }
}
