import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";
import { CAPABILITY_IDS, isValidCapability } from "@/lib/permissions";

/** Создание роли. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCapability("roles.manage");
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      capabilities?: string[];
    };
    if (!body.name || body.name.trim().length < 2) return fail("Укажите название роли");

    const exists = await prisma.role.findUnique({ where: { name: body.name.trim() } });
    if (exists) return fail("Роль с таким названием уже существует", 409);

    const caps = (body.capabilities ?? []).filter(isValidCapability);
    const role = await prisma.role.create({
      data: {
        name: body.name.trim(),
        description: body.description,
        permissions: {
          create: caps.map((capability) => ({ capability, allowed: true })),
        },
      },
    });
    await audit(user.id, "roles.create", "role", role.id, role.name);
    return ok({ id: role.id });
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Изменение матрицы прав роли. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCapability("roles.manage");
    const body = (await req.json()) as {
      roleId?: string;
      capabilities?: string[];
      description?: string;
    };
    if (!body.roleId) return fail("Укажите roleId");
    const role = await prisma.role.findUnique({
      where: { id: body.roleId },
      include: { permissions: true },
    });
    if (!role) return fail("Роль не найдена", 404);

    if (body.capabilities !== undefined) {
      const caps = body.capabilities.filter((c) => CAPABILITY_IDS.includes(c));
      const next = new Set(caps);
      for (const cap of CAPABILITY_IDS) {
        const allowed = next.has(cap);
        const existing = role.permissions.find((p) => p.capability === cap);
        if (existing) {
          await prisma.rolePermission.update({
            where: { id: existing.id },
            data: { allowed },
          });
        } else if (allowed) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, capability: cap, allowed: true },
          });
        }
      }
    }
    if (body.description !== undefined) {
      await prisma.role.update({
        where: { id: role.id },
        data: { description: body.description },
      });
    }
    await audit(user.id, "roles.update", "role", role.id, role.name);
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}

/** Удаление роли (если не привязана). */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCapability("roles.manage");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return fail("Укажите id");
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { bindings: true, keys: true } } },
    });
    if (!role) return fail("Роль не найдена", 404);
    if (role._count.bindings > 0 || role._count.keys > 0) {
      return fail("Роль используется (профили или ключи). Сначала отвяжите её.");
    }
    await prisma.role.delete({ where: { id } });
    await audit(user.id, "roles.delete", "role", id, role.name);
    return ok({});
  } catch (e) {
    return handleAuthError(e);
  }
}
