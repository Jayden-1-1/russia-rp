import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await requireCapability("questions.manage");
    const src = await prisma.callTemplate.findUnique({
      where: { id: templateId },
      include: { questions: true },
    });
    if (!src) return fail("Шаблон не найден", 404);

    const copy = await prisma.callTemplate.create({
      data: {
        name: `${src.name} (копия)`,
        description: src.description,
        questions: {
          create: src.questions.map((q) => ({
            order: q.order,
            text: q.text,
            type: q.type,
            timeLimitSec: q.timeLimitSec,
            required: q.required,
            points: q.points,
            criteria: q.criteria,
            category: q.category,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    await audit(user.id, "template.copy", "call_template", copy.id, `from:${templateId}`);
    return ok({
      template: {
        id: copy.id,
        name: copy.name,
        description: copy.description,
        isActive: copy.isActive,
        questions: copy.questions,
      },
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
