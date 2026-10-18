import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import KeysClient from "./KeysClient";

export const dynamic = "force-dynamic";

export default async function AdminKeys() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "keys.manage")) redirect("/admin");

  const [keys, roles] = await Promise.all([
    prisma.inviteKey.findMany({
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/profiles" label="Профили" />
          <NavItem href="/admin/keys" label="Ключи" active />
          <NavItem href="/admin/roles" label="Роли" />
        </>
      }
      track="Администрирование → Ключи"
      title="Ключи-приглашения"
      user={user}
    >
      <KeysClient
        roles={roles.map((r) => ({ id: r.id, name: r.name }))}
        keys={keys.map((k) => ({
          id: k.id,
          code: k.code,
          purpose: k.purpose,
          role: k.role?.name ?? null,
          maxUses: k.maxUses,
          usedCount: k.usedCount,
          note: k.note,
          createdAt: k.createdAt.toISOString(),
          expiresAt: k.expiresAt?.toISOString() ?? null,
          disabledAt: k.disabledAt?.toISOString() ?? null,
        }))}
      />
    </AppShell>
  );
}
