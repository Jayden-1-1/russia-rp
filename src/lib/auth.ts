/**
 * Серверный слой авторизации: локальные аккаунты, сессии, роли, матрица доступа.
 * Права ВСЕГДА проверяются на сервере; frontend только отражает их.
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { randomToken, hashPassword, verifyPassword } from "@/lib/crypto";
import { CAPABILITY_IDS, type Capability } from "@/lib/permissions";

export const SESSION_COOKIE = "rrp_session";

export interface AuthUser {
  id: string;
  login: string;
  displayName: string | null;
  position: string | null;
  isRootAdmin: boolean;
  capabilities: Capability[];
  roles: { id: string; name: string }[];
}

// ---------- Сессии ----------

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const cfg = getConfig();
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + cfg.session.ttlHours * 3600 * 1000);
  const session = await prisma.session.create({
    data: { token, userId, expiresAt, ip, userAgent },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return session;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

// ---------- Вход ----------

export class LoginError extends Error {
  constructor(public reason: "INVALID" | "INACTIVE") {
    super(reason);
  }
}

/** Вход по логину и паролю. */
export async function login(login: string, password: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { login } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new LoginError("INVALID");
  }
  if (!user.isActive) throw new LoginError("INACTIVE");
  await createSession(user.id);
  return user.id;
}

/** Создание аккаунта root-администратора при первом запуске. */
export async function ensureRootAdmin(): Promise<void> {
  const cfg = getConfig();
  const existing = await prisma.user.findUnique({ where: { login: cfg.rootLogin } });
  if (existing) return;
  await prisma.user.create({
    data: {
      login: cfg.rootLogin,
      passwordHash: hashPassword(cfg.rootPassword),
      displayName: "Главный администратор",
      position: "Главный администратор",
      isRootAdmin: true,
    },
  });
}

// ---------- Загрузка пользователя с ролями ----------

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const user = session.user;
  if (!user.isActive) return null;

  const bindings = await prisma.roleBinding.findMany({
    where: { userId: user.id },
    include: {
      role: { include: { permissions: { where: { allowed: true } } } },
    },
  });

  // Права: UNION по всем ролям пользователя + полный набор для root-админа
  const capabilitySet = new Set<string>();
  for (const rb of bindings) {
    for (const perm of rb.role.permissions) {
      if (perm.allowed && CAPABILITY_IDS.includes(perm.capability)) {
        capabilitySet.add(perm.capability);
      }
    }
  }
  if (user.isRootAdmin) {
    (CAPABILITY_IDS as string[]).forEach((c) => capabilitySet.add(c));
  }

  await prisma.user
    .update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    position: user.position,
    isRootAdmin: user.isRootAdmin,
    capabilities: [...capabilitySet] as Capability[],
    roles: bindings.map((rb) => ({ id: rb.role.id, name: rb.role.name })),
  };
}

export function hasCapability(user: AuthUser | null, cap: Capability): boolean {
  if (!user) return false;
  if (user.isRootAdmin) return true;
  return user.capabilities.includes(cap);
}

export async function requireCapability(cap: Capability): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHORIZED", 401);
  if (!hasCapability(user, cap)) throw new AuthError("FORBIDDEN", 403);
  return user;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN", public status: number) {
    super(code);
  }
}
