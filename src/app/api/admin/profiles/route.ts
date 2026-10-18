import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";
import { hashPassword } from "@/lib/crypto";

/** Список профилей (только profiles.manage). */
export async function GET() {
  try {
    await requireCapability("profiles.manage");
    const users = await prisma.user.findMany({
      include: { roleBindings: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok({
      profiles: users.map((u) => ({
        id: u.id,
        login: u.login,
        displayName: u.displayName,
        position: u.position,
        isRootAdmin: u.isRootAdmin,
        isActive: u.isActive,
        roles: u.roleBindings.map((rb) => rb.role.name),
        lastSeenAt: u.lastSeenAt.toISOString(),
      })),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Создание профиля администратором. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("profiles.manage");
    const body = (await req.json()) as {
      login?: string;
      password?: string;
      displayName?: string;
      position?: string;
      roleIds?: string[];
    };
    if (!body.login || !body.password) return fail("Укажите логин и пароль");
    if (body.password.length < 6) return fail("Пароль минимум 6 символов");
    if (body.login.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(body.login)) {
      return fail("Логин: 3+ символа, латиница/цифры");
    }

    const exists = await prisma.user.findUnique({ where: { login: body.login } });
    if (exists) return fail("Такой логин уже занят", 409);

    if (body.roleIds?.length) {
      const roles = await prisma.role.findMany({
        where: { id: { in: body.roleIds } },
      });
      if (roles.length !== body.roleIds.length) return fail("Роль не найдена", 404);
    }

    const created = await prisma.user.create({
      data: {
        login: body.login,
        passwordHash: hashPassword(body.password),
        displayName: body.displayName || body.login,
        position: body.position,
        createdById: user.id,
        roleBindings: {
          create: (body.roleIds ?? []).map((roleId) => ({ roleId })),
        },
      },
    });
    await audit(user.id, "profiles.create", "user", created.id, body.login);
    return ok({ id: created.id, login: created.login });
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Изменение профиля: роли, должность, активность, смена пароля. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCapability("profiles.manage");
    const body = (await req.json()) as {
      userId?: string;
      position?: string;
      isActive?: boolean;
      roleIds?: string[];
      newPassword?: string;
    };
    if (!body.userId) return fail("Укажите userId");
    const target = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!target) return fail("Профиль не найден", 404);
    if (target.isRootAdmin && body.isActive === false) {
      return fail("Нельзя деактивировать root-администратора");
    }

    if (body.roleIds) {
      const roles = await prisma.role.findMany({
        where: { id: { in: body.roleIds } },
      });
      if (roles.length !== body.roleIds.length) return fail("Роль не найдена", 404);
      await prisma.roleBinding.deleteMany({ where: { userId: target.id } });
      await prisma.roleBinding.createMany({
        data: body.roleIds.map((roleId) => ({ userId: target.id, roleId })),
      });
    }
    await prisma.user.update({
      where: { id: target.id },
      data: {
        position: body.position ?? undefined,
        isActive: body.isActive ?? undefined,
        passwordHash: body.newPassword
          ? body.newPassword.length >= 6
            ? hashPassword(body.newPassword)
            : undefined
          : undefined,
      },
    });
    await audit(user.id, "profiles.update", "user", target.id, target.login);
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}
