import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureRootAdmin } from "@/lib/auth";
import { AppShell, NavItem, Table, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await ensureRootAdmin();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "admin.panel")) redirect("/cabinet");

  const [activeSessions, pendingCandidates, profiles, keys, recentSessions, recentLogs] =
    await Promise.all([
      prisma.callSession.count({ where: { status: "active" } }),
      prisma.callAssignment.count({ where: { status: "assigned" } }),
      prisma.user.count(),
      prisma.inviteKey.count({ where: { disabledAt: null } }),
      prisma.callSession.findMany({
        where: { status: { in: ["completed", "awaiting_review"] } },
        include: { assignment: { include: { user: true, template: true } } },
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const nav = (
    <>
      <NavItem href="/admin" label="Обзор" active />
      {hasCapability(user, "profiles.manage") ? (
        <NavItem href="/admin/profiles" label="Профили" />
      ) : null}
      {hasCapability(user, "keys.manage") ? (
        <NavItem href="/admin/keys" label="Ключи" />
      ) : null}
      {hasCapability(user, "roles.manage") ? (
        <NavItem href="/admin/roles" label="Роли" />
      ) : null}
      {hasCapability(user, "candidates.manage") ? (
        <NavItem href="/admin/candidates" label="Кандидаты" />
      ) : null}
      {hasCapability(user, "calls.create") ? <NavItem href="/admin/calls" label="Обзвоны" /> : null}
      {hasCapability(user, "questions.manage") ? <NavItem href="/admin/questions" label="Конструктор" /> : null}
      {hasCapability(user, "results.view") ? <NavItem href="/admin/results" label="Результаты" /> : null}
    </>
  );

  return (
    <AppShell nav={nav} track="Администрирование" title="Обзор" user={user}>
      {/* Метрики */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line mb-8">
        <div className="bg-panel p-5">
          <p className="track mb-2">Активные обзвоны</p>
          <p className="text-3xl font-semibold">{activeSessions}</p>
        </div>
        <div className="bg-panel p-5">
          <p className="track mb-2">Ожидают кандидаты</p>
          <p className="text-3xl font-semibold">{pendingCandidates}</p>
        </div>
        <div className="bg-panel p-5">
          <p className="track mb-2">Профили</p>
          <p className="text-3xl font-semibold">{profiles}</p>
        </div>
        <div className="bg-panel p-5">
          <p className="track mb-2">Активные ключи</p>
          <p className="text-3xl font-semibold">{keys}</p>
        </div>
      </section>

      {/* Последние завершённые сессии */}
      <section className="mb-8">
        <h2 className="track mb-4">Последние завершённые сессии</h2>
        {recentSessions.length ? (
          <Table head={["Кандидат", "Вариант", "Статус", "Начата"]}>
            {recentSessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  {s.assignment.user.displayName ?? s.assignment.user.login}
                </td>
                <td className="px-4 py-3 text-fog">
                  {s.assignment.template.category === "builder"
                    ? "Билдер-скриптер"
                    : "Правила RP"}
                </td>
                <td className="px-4 py-3 text-fog">
                  {s.status === "awaiting_review" ? "Ожидает решения" : "Завершена"}
                </td>
                <td className="px-4 py-3 text-fog">{s.startedAt.toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Завершённых сессий пока нет.</Empty>
        )}
      </section>

      {/* Журнал действий */}
      <section>
        <h2 className="track mb-4">Журнал действий</h2>
        {recentLogs.length ? (
          <Table head={["Пользователь", "Действие", "Детали", "Время"]}>
            {recentLogs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-fog">
                  {l.user ? l.user.displayName ?? l.user.login : "—"}
                </td>
                <td className="px-4 py-3 track !normal-case !tracking-normal">{l.action}</td>
                <td className="px-4 py-3 text-mist text-xs max-w-[240px] truncate">
                  {l.details ?? "—"}
                </td>
                <td className="px-4 py-3 text-fog">{l.createdAt.toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Журнал пуст.</Empty>
        )}
      </section>
    </AppShell>
  );
}
