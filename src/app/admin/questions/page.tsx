import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import ConstructorClient from "./ConstructorClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestions() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "questions.manage")) redirect("/admin");

  const templates = await prisma.callTemplate.findMany({
    include: { questions: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/questions" label="Конструктор" active />
        </>
      }
      track="Администрирование → Конструктор"
      title="Конструктор вопросов"
      user={user}
    >
      <ConstructorClient
        initialTemplates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          isActive: t.isActive,
          questions: t.questions.map((q) => ({
            id: q.id,
            order: q.order,
            text: q.text,
            type: q.type,
            timeLimitSec: q.timeLimitSec,
            required: q.required,
            points: q.points,
            criteria: q.criteria,
            category: q.category,
          })),
        }))}
      />
    </AppShell>
  );
}
