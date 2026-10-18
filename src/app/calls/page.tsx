import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem, Table, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "calls.view") && !hasCapability(user, "calls.take")) {
    redirect("/cabinet");
  }

  const assignments = await prisma.callAssignment.findMany({
    where: { userId: user.id },
    include: {
      // Имя варианта скрыто от кандидата
      sessions: { orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell nav={
      <>
        <NavItem href="/cabinet" label="Кабинет" />
        <NavItem href="/calls" label="Мои обзвоны" active />
      </>
    } track="Обзвоны" title="Мои обзвоны" user={user}>
      {assignments.length ? (
        <Table head={["Обзвон", "Статус", "Назначен", ""]}>
          {assignments.map((a) => {
            const s = a.sessions[0];
            const canTake = a.status === "assigned" && hasCapability(user, "calls.take");
            return (
              <tr key={a.id}>
                <td className="px-4 py-3 track !normal-case !tracking-normal">
                  Обзвон #{a.id.slice(-6).toUpperCase()}
                </td>
                <td className="px-4 py-3 text-fog">
                  {a.status === "completed" ? "Завершён" : s?.status === "active" ? "Активен" : "Ожидает"}
                </td>
                <td className="px-4 py-3 text-fog">{a.createdAt.toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3">
                  {canTake ? (
                    <a href={`/calls/take/${a.id}`} className="track hover:text-paper transition-colors">
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
        <Empty>Обзвонов нет. Ожидайте приглашения.</Empty>
      )}
    </AppShell>
  );
}
