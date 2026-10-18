/**
 * Центральная конфигурация проекта.
 * Все секреты читаются только на сервере.
 */

export interface AppConfig {
  session: {
    secret: string;
    ttlHours: number;
  };
  appUrl: string | null;
  rootLogin: string;
  rootPassword: string;
}

export function getConfig(): AppConfig {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
  return {
    session: {
      secret: sessionSecret(),
      ttlHours: Number(process.env.SESSION_TTL_HOURS ?? 72),
    },
    appUrl,
    rootLogin: process.env.ROOT_LOGIN ?? "admin",
    rootPassword: process.env.ROOT_PASSWORD ?? "admin123",
  };
}

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET обязателен в production");
    }
    return "insecure-dev-secret-change-me";
  }
  return s;
}
