import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import CandidatesClient from "./CandidatesClient";

export const dynamic = "force-dynamic";

export default async function AdminCandidates() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "candidates.manage")) redirect("/admin");

  const candidates = await prisma.user.findMany({
    include: {
      roleBindings: { include: { role: true } },
      callAssignments: {
        include: {
          template: { select: { name: true, category: true } },
          sessions: { orderBy: { startedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/candidates" label="Кандидаты" active />
        </>
      }
      track="Администрирование → Кандидаты"
      title="Кандидаты"
      user={user}
    >
      <CandidatesClient
        candidates={candidates.map((c) => ({
          id: c.id,
          login: c.login,
          displayName: c.displayName,
          roles: c.roleBindings.map((rb) => rb.role.name),
          assignments: c.callAssignments.map((a) => ({
            id: a.id,
            category: a.template.category,
            status: a.status,
            sessionStatus: a.sessions[0]?.status ?? null,
          })),
          lastSeen: c.lastSeenAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
