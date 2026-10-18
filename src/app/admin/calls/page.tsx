import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem, Table, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminCalls() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "calls.create")) redirect("/admin");

  const sessions = await prisma.callSession.findMany({
    include: {
      assignment: {
        include: { user: true, template: { select: { name: true, category: true } } },
      },
      examiner: true,
      _count: { select: { answers: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  const templates = await prisma.callTemplate.findMany({
    where: { isActive: true },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/calls" label="Обзвоны" active />
        </>
      }
      track="Администрирование → Обзвоны"
      title="Обзвоны"
      user={user}
    >
      {/* Доступные шаблоны */}
      <section className="mb-8">
        <h2 className="track mb-4">Шаблоны для назначения</h2>
        {templates.length ? (
          <Table head={["Шаблон", "Вопросов", "Назначить"]}>
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3 text-fog">{t._count.questions}</td>
                <td className="px-4 py-3">
                  <a href="/admin/candidates" className="track hover:text-paper transition-colors">
                    Кандидаты →
                  </a>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Нет активных шаблонов. Создайте шаблон в конструкторе.</Empty>
        )}
      </section>

      {/* Сессии */}
      <section>
        <h2 className="track mb-4">Сессии</h2>
        {sessions.length ? (
          <Table head={["Кандидат", "Шаблон", "Статус", "Ответов", "Начата", ""]}>
            {sessions.map((s) => (
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
                  {s.status === "active"
                    ? "Активна"
                    : s.status === "awaiting_review"
                      ? "Ожидает решения"
                      : s.status === "completed"
                        ? "Завершена"
                        : "Отменена"}
                </td>
                <td className="px-4 py-3 text-fog">{s._count.answers}</td>
                <td className="px-4 py-3 text-mist">{s.startedAt.toLocaleString("ru-RU")}</td>
                <td className="px-4 py-3">
                  {hasCapability(user, "results.view") ? (
                    <a href="/admin/results" className="track hover:text-paper transition-colors">
                      Результаты →
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Сессий нет.</Empty>
        )}
      </section>
    </AppShell>
  );
}
