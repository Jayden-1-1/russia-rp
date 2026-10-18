import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("questions.manage");
    const body = (await req.json()) as { name?: string; description?: string };
    if (!body.name || !body.name.trim()) return fail("Укажите название шаблона");
    if (body.name.length > 120) return fail("Название слишком длинное");

    const template = await prisma.callTemplate.create({
      data: { name: body.name.trim(), description: body.description?.trim() ?? null },
    });
    await audit(user.id, "template.create", "call_template", template.id);
    return ok({ template });
  } catch (e) {
    return handleAuthError(e);
  }
}
