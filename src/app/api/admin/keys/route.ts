import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";
import { randomKeyCode } from "@/lib/crypto";
import { isValidCapability } from "@/lib/permissions";

/** Список ключей (только keys.manage). */
export async function GET() {
  try {
    await requireCapability("keys.manage");
    const keys = await prisma.inviteKey.findMany({
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok({
      keys: keys.map((k) => ({
        id: k.id,
        code: k.code,
        purpose: k.purpose,
        role: k.role?.name ?? null,
        maxUses: k.maxUses,
        usedCount: k.usedCount,
        note: k.note,
        createdAt: k.createdAt.toISOString(),
        expiresAt: k.expiresAt?.toISOString() ?? null,
        disabledAt: k.disabledAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Создание ключа. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("keys.manage");
    const body = (await req.json()) as {
      purpose?: "profile" | "call";
      roleId?: string;
      templateId?: string;
      maxUses?: number;
      note?: string;
      expiresDays?: number;
    };

    const purpose = body.purpose ?? "profile";
    if (purpose === "profile" && !body.roleId) {
      return fail("Укажите роль для ключа профиля");
    }
    if (!["profile", "call"].includes(purpose)) {
      return fail("Недопустимый тип ключа");
    }

    if (body.roleId) {
      const role = await prisma.role.findUnique({ where: { id: body.roleId } });
      if (!role) return fail("Роль не найдена", 404);
    }

    const key = await prisma.inviteKey.create({
      data: {
        code: randomKeyCode(),
        purpose,
        roleId: body.roleId ?? null,
        templateId: body.templateId ?? null,
        maxUses: Math.max(1, Math.min(999, body.maxUses ?? 1)),
        note: body.note,
        createdById: user.id,
        expiresAt: body.expiresDays
          ? new Date(Date.now() + body.expiresDays * 24 * 3600 * 1000)
          : null,
      },
    });
    await audit(user.id, "keys.create", "invite_key", key.id, purpose);
    return ok({ id: key.id, code: key.code });
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Отключение ключа. */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCapability("keys.manage");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return fail("Укажите id");
    const key = await prisma.inviteKey.findUnique({ where: { id } });
    if (!key) return fail("Ключ не найден", 404);
    await prisma.inviteKey.update({
      where: { id },
      data: { disabledAt: new Date() },
    });
    await audit(user.id, "keys.disable", "invite_key", id, key.code);
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}
