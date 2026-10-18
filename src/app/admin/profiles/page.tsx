import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import ProfilesClient from "./ProfilesClient";

export const dynamic = "force-dynamic";

export default async function AdminProfiles() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "profiles.manage")) redirect("/admin");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: { roleBindings: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.role.findMany({ include: { permissions: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/profiles" label="Профили" active />
          <NavItem href="/admin/keys" label="Ключи" />
          <NavItem href="/admin/roles" label="Роли" />
        </>
      }
      track="Администрирование → Профили"
      title="Профили"
      user={user}
    >
      <ProfilesClient
        canEdit={hasCapability(user, "profiles.manage")}
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          capabilities: r.permissions.filter((p) => p.allowed).map((p) => p.capability),
        }))}
        profiles={users.map((u) => ({
          id: u.id,
          login: u.login,
          displayName: u.displayName,
          position: u.position,
          isRootAdmin: u.isRootAdmin,
          isActive: u.isActive,
          roleIds: u.roleBindings.map((rb) => rb.roleId),
          roleNames: u.roleBindings.map((rb) => rb.role.name),
          lastSeenAt: u.lastSeenAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
