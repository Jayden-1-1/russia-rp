import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AnimatedGrid from "@/components/AnimatedGrid";
import TakeClient from "./TakeClient";

export const dynamic = "force-dynamic";

export default async function TakePage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "calls.take")) redirect("/cabinet");
  // Администрация НЕ проходит обзвоны — она их проводит.
  // Блокируем root-админа и проверяющих (grade/manage) от прохождения.
  if (
    user.isRootAdmin ||
    hasCapability(user, "results.grade") ||
    hasCapability(user, "candidates.manage")
  ) {
    redirect("/calls");
  }

  const assignment = await prisma.callAssignment.findUnique({
    where: { id: assignmentId },
    // Имя шаблона намеренно НЕ подгружаем — кандидат не должен видеть вариант
    include: {
      template: { select: { category: true } },
      sessions: { where: { status: "active" }, take: 1 },
    },
  });
  if (!assignment || assignment.userId !== user.id) redirect("/calls");

  // Полноэкранный режим без навигации: кандидат не выходит из обзвона
  // (в том числе случайно) до его завершения.
  return (
    <div className="relative min-h-dvh bg-ink flex flex-col">
      <AnimatedGrid aria-hidden />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <TakeClient assignmentId={assignmentId} category={assignment.template.category} />
      </main>
    </div>
  );
}
