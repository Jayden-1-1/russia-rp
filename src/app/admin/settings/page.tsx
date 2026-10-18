import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CAPABILITIES } from "@/lib/permissions";
import { AppShell, NavItem, Table, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/settings" label="Настройки" active />
        </>
      }
      track="Администрирование → Настройки"
      title="Настройки"
      user={user}
    >
      {/* Возможности сайта */}
      <section className="mb-8">
        <h2 className="track mb-4">Возможности сайта</h2>
        <div className="border border-line bg-panel p-5">
          <p className="text-xs text-mist leading-relaxed">
            Полный список возможностей матрицы доступа (управление — в разделе «Роли»):
          </p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-1">
            {CAPABILITIES.map((c) => (
              <li key={c.id} className="text-xs text-fog">
                {c.label} <span className="text-mist">({c.id})</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Журнал действий */}
      <section>
        <h2 className="track mb-4">Журнал действий</h2>
        {logs.length ? (
          <Table head={["Пользователь", "Действие", "Детали", "Время"]}>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">{l.user?.displayName ?? l.user?.login ?? "—"}</td>
                <td className="px-4 py-3 text-fog">{l.action}</td>
                <td className="px-4 py-3 text-mist text-xs">
                  {l.details ?? l.entity ?? "—"}
                </td>
                <td className="px-4 py-3 text-mist">{l.createdAt.toLocaleString("ru-RU")}</td>
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
