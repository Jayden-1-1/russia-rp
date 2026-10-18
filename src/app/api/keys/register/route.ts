import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { ok, fail } from "@/lib/api";
import { createSession } from "@/lib/auth";

/**
 * Публичная регистрация по ключу-приглашению. Два вида ключей:
 *  - profile (обычный): создаёт аккаунт с привязанной ролью.
 *  - call (для обзвона): создаёт аккаунт кандидата и сразу
 *    логинит его на страницу ожидания обзвона.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      login?: string;
      displayName?: string;
      password?: string;
    };
    if (!body.code || !body.login || !body.password) {
      return fail("Заполните все поля");
    }
    if (body.password.length < 6) return fail("Пароль минимум 6 символов");
    if (body.login.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(body.login)) {
      return fail("Логин: 3+ символа, латиница/цифры");
    }

    const key = await prisma.inviteKey.findUnique({
      where: { code: body.code.toUpperCase() },
      include: { role: true },
    });
    if (!key) return fail("Ключ не найден", 404);
    if (key.disabledAt) return fail("Ключ отключён", 410);
    if (key.expiresAt && key.expiresAt < new Date()) return fail("Ключ истёк", 410);
    if (key.usedCount >= key.maxUses) return fail("Ключ уже использован", 410);

    const exists = await prisma.user.findUnique({ where: { login: body.login } });
    if (exists) return fail("Такой логин уже занят", 409);

    let roleId: string | null = null;
    let position: string | null = null;
    if (key.purpose === "profile" && key.role) {
      roleId = key.roleId;
      position = key.role.name;
    } else if (key.purpose === "call") {
      // Ключ обзвона: роль «Кандидат»
      const candidateRole = await prisma.role.findUnique({ where: { name: "Кандидат" } });
      roleId = candidateRole?.id ?? null;
      position = "Кандидат на должность";
    } else {
      return fail("Ключ не предназначен для регистрации");
    }

    const user = await prisma.user.create({
      data: {
        login: body.login,
        passwordHash: hashPassword(body.password),
        displayName: body.displayName || body.login,
        position,
        createdById: key.createdById,
        roleBindings: roleId ? { create: { roleId } } : undefined,
      },
    });
    await prisma.inviteKey.update({
      where: { id: key.id },
      data: { usedCount: { increment: 1 } },
    });

    // Сразу входим — попадаем на страницу ожидания
    await createSession(user.id);

    return ok({
      login: user.login,
      purpose: key.purpose,
      redirect: key.purpose === "call" ? "/calls/wait" : "/cabinet",
    });
  } catch (e) {
    console.error(e);
    return fail("Ошибка регистрации");
  }
}
