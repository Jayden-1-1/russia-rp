import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import type { ReactNode } from "react";
import PickupNotifier from "@/components/PickupNotifier";
import Stage2Notifier from "@/components/Stage2Notifier";

export const dynamic = "force-dynamic";

/**
 * Общий каркас админки: уведомления «Взять обзвон» (этап 1) и
 * «Кандидат готов ко 2 туру» работают на ЛЮБОЙ странице админ-панели.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "admin.panel") && !user.isRootAdmin) redirect("/cabinet");
  const canNotify = user.isRootAdmin || hasCapability(user, "results.grade");
  return (
    <div>
      {canNotify ? (
        <>
          <PickupNotifier />
          <Stage2Notifier />
        </>
      ) : null}
      {children}
    </div>
  );
}
