import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem, Table, Empty } from "@/components/ui";
import { CAPABILITIES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CabinetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canCalls = hasCapability(user, "calls.view") || hasCapability(user, "calls.take");
  const isAdmin = hasCapability(user, "admin.panel");

  // Назначения пользователя
  const assignments = canCalls
    ? await prisma.callAssignment.findMany({
        where: { userId: user.id },
        include: {
          // Имя варианта скрыто от кандидата
          sessions: { orderBy: { startedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const completed = await prisma.callAssignment.findMany({
    where: { userId: user.id, status: "completed" },
    include: {
      template: { select: { name: true, category: true } },
      sessions: { include: { decisions: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  const nav = (
    <>
      <NavItem href="/cabinet" label="Кабинет" active />
      {canCalls ? <NavItem href="/calls" label="Мои обзвоны" /> : null}
      {isAdmin ? (
        <>
          <NavItem href="/admin" label="Админ-панель" />
        </>
      ) : null}
    </>
  );

  return (
    <AppShell
      nav={nav}
      track="Личный кабинет"
      title={user.displayName ?? user.login}
      user={user}
    >
      {/* Профиль и роли */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line mb-8">
        <div className="bg-panel p-5">
          <p className="track mb-3">Аккаунт</p>
          <p className="text-sm">{user.displayName ?? user.login}</p>
          <p className="track mt-2 !normal-case !tracking-normal">Логин: {user.login}</p>
          {user.position ? (
            <p className="text-xs text-mist mt-2">Должность: {user.position}</p>
          ) : null}
          {user.isRootAdmin ? <p className="track mt-2 !text-paper">Root-администратор</p> : null}
        </div>
        <div className="bg-panel p-5">
          <p className="track mb-3">Роли сервера</p>
          {user.roles.length ? (
            <ul className="space-y-1">
              {user.roles.map((r) => (
                <li key={r.id} className="text-sm text-fog">{r.name}</li>
              ))}
            </ul>
          ) : user.isRootAdmin ? (
            <p className="text-sm text-fog">Все права (root-администратор)</p>
          ) : (
            <p className="text-sm text-mist">Роли не назначены</p>
          )}
        </div>
        <div className="bg-panel p-5">
          <p className="track mb-3">Доступные разделы</p>
          <ul className="space-y-1">
            {CAPABILITIES.filter(
              (c) => user.capabilities.includes(c.id) || (c.default && c.id === "cabinet.view")
            ).map((c) => (
              <li key={c.id} className="text-sm text-fog">{c.label}</li>
            ))}
            {user.capabilities.length === 0 && !user.isRootAdmin ? (
              <li className="text-sm text-mist">Ожидайте назначения прав администратором</li>
            ) : null}
          </ul>
        </div>
      </section>

      {/* Назначенные обзвоны */}
      <section className="mb-8">
        <h2 className="track mb-4">Назначенные обзвоны</h2>
        {canCalls ? (
          assignments.length ? (
            <Table head={["Обзвон", "Статус", "Сессия", ""]}>
              {assignments.map((a) => {
                const s = a.sessions[0];
                const active = s?.status === "active";
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 track !normal-case !tracking-normal">
                      Обзвон #{a.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-fog">
                      {a.status === "completed" ? "Завершён" : active ? "Активен" : "Ожидает"}
                    </td>
                    <td className="px-4 py-3 track !normal-case !tracking-normal">
                      {s ? s.status : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "assigned" && hasCapability(user, "calls.take") ? (
                        <a
                          href={`/calls/take/${a.id}`}
                          className="track hover:text-paper transition-colors"
                        >
                          {s?.status === "active" ? "Продолжить →" : "Начать →"}
                        </a>
                      ) : (
                        <span className="track !text-mist/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty>Назначенных обзвонов пока нет.</Empty>
          )
        ) : (
          <Empty>У вас нет доступа к обзвонам.</Empty>
        )}
      </section>

      {/* История результатов */}
      <section>
        <h2 className="track mb-4">История прохождений</h2>
        {completed.length ? (
          <Table head={["Направление", "Дата", "Итог"]}>
            {completed.map((a) => {
              const d = a.sessions[0]?.decisions[0];
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    {a.template.category === "builder" ? "Билдер-скриптер" : "Правила RP"}
                  </td>
                  <td className="px-4 py-3 text-fog">
                    {a.completedAt?.toLocaleDateString("ru-RU") ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d ? (
                      <span className={d.decision === "approved" ? "text-paper" : "text-mist"}>
                        {d.decision === "approved"
                          ? "Принят"
                          : d.decision === "rejected"
                            ? "Отклонён"
                            : "На доработке"}
                      </span>
                    ) : (
                      <span className="text-mist">Рассматривается</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty>История пуста.</Empty>
        )}
      </section>
    </AppShell>
  );
}
