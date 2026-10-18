import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Назначение обзвона кандидату.
 * Категория направления задаётся явно (rules | builder),
 * ВАРИАНТ внутри категории выбирается СЛУЧАЙНО — его имя не знает никто,
 * включая назначающего администратора (исключает подсказывание).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("candidates.manage");
    const body = (await req.json()) as {
      userId?: string;
      category?: "rules" | "builder";
      note?: string;
    };
    if (!body.userId) return fail("Укажите userId");
    const category = body.category ?? "rules";
    if (!["rules", "builder"].includes(category)) return fail("Неверная категория");

    const target = await prisma.user.findUnique({
      where: { id: body.userId },
      include: { roleBindings: { include: { role: { include: { permissions: true } } } } },
    });
    if (!target) return fail("Пользователь не найден", 404);
    // Администрация не проходит обзвоны — назначать им нельзя
    const targetCaps = new Set(
      target.roleBindings.flatMap((rb) =>
        rb.role.permissions.filter((p) => p.allowed).map((p) => p.capability)
      )
    );
    if (
      target.isRootAdmin ||
      targetCaps.has("results.grade") ||
      targetCaps.has("candidates.manage")
    ) {
      return fail("Администрация не проходит обзвоны — только проводит их");
    }

    // Только активные варианты данной категории с вопросами
    const variants = await prisma.callTemplate.findMany({
      where: { isActive: true, category, questions: { some: {} } },
    });
    if (variants.length === 0) {
      return fail(
        category === "builder"
          ? "Нет активных вариантов для билдеров-скриптеров"
          : "Нет активных вариантов по правилам RP"
      );
    }

    // Случайный вариант
    const chosen = variants[Math.floor(Math.random() * variants.length)];

    // Не дублируем активное назначение
    const existing = await prisma.callAssignment.findFirst({
      where: { userId: body.userId, status: "assigned" },
    });
    if (existing) return fail("У кандидата уже есть активное назначение");

    const assignment = await prisma.callAssignment.create({
      data: {
        userId: body.userId,
        templateId: chosen.id,
        assignedBy: user.id,
        note: body.note,
      },
    });
    await audit(
      user.id,
      "calls.assign",
      "call_assignment",
      assignment.id,
      `user:${body.userId} category:${category} (random variant)`
    );
    return ok({ assignmentId: assignment.id });
  } catch (e) {
    return handleAuthError(e);
  }
}
