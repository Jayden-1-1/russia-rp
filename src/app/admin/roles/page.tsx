import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import { CAPABILITIES } from "@/lib/permissions";
import RolesClient from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function AdminRoles() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "roles.manage")) redirect("/admin");

  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: { select: { bindings: true, keys: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/profiles" label="Профили" />
          <NavItem href="/admin/keys" label="Ключи" />
          <NavItem href="/admin/roles" label="Роли" active />
        </>
      }
      track="Администрирование → Роли"
      title="Роли"
      user={user}
    >
      <RolesClient
        allCapabilities={CAPABILITIES.map((c) => ({ id: c.id, label: c.label }))}
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          capabilities: r.permissions.filter((p) => p.allowed).map((p) => p.capability),
          usersCount: r._count.bindings,
          keysCount: r._count.keys,
        }))}
      />
    </AppShell>
  );
}
