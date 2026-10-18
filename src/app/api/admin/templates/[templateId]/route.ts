import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await requireCapability("questions.manage");

    // Нельзя удалить шаблон с активными назначениями
    const active = await prisma.callAssignment.count({
      where: { templateId, status: "assigned" },
    });
    if (active > 0) {
      return fail(`Шаблон используется в ${active} активных назначениях`, 409);
    }

    await prisma.callTemplate.delete({ where: { id: templateId } });
    await audit(user.id, "template.delete", "call_template", templateId);
    return ok({ deleted: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
