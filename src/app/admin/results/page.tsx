import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, NavItem } from "@/components/ui";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function AdminResults() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasCapability(user, "results.view")) redirect("/admin");

  const sessions = await prisma.callSession.findMany({
    where: { status: { in: ["active", "awaiting_review", "completed"] } },
    include: {
      assignment: {
        include: {
          user: true,
          template: { select: { name: true, category: true } },
        },
      },
      answers: {
        include: { question: true },
        orderBy: { order: "asc" },
      },
      decisions: { include: { examiner: true } },
      stageGrades: true,
      practiceTask: { select: { title: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return (
    <AppShell
      nav={
        <>
          <NavItem href="/admin" label="Обзор" />
          <NavItem href="/admin/results" label="Результаты" active />
        </>
      }
      track="Администрирование → Результаты"
      title="Результаты"
      user={user}
    >
      <ResultsClient
        canGrade={hasCapability(user, "results.grade")}
        sessions={sessions.map((s) => ({
          id: s.id,
          candidate: s.assignment.user.displayName ?? s.assignment.user.login,
          variant: s.assignment.template.name,
          category: s.assignment.template.category,
          status: s.status,
          stage: s.stage,
          startedAt: s.startedAt.toISOString(),
          practiceTitle: s.practiceTask?.title ?? null,
          stageResults: s.stageGrades.map((g) => ({
            stage: g.stage,
            score: g.totalScore,
            max: g.maxScore,
            passed: g.passed,
          })),
          decision: s.decisions[0]
            ? {
                decision: s.decisions[0].decision,
                comment: s.decisions[0].comment,
                score: s.decisions[0].score,
                examiner: s.decisions[0].examiner.displayName ?? s.decisions[0].examiner.login,
              }
            : null,
          answers: s.answers.map((a) => ({
            id: a.id,
            questionId: a.questionId,
            order: a.order,
            text: a.question.text,
            type: a.question.type,
            status: a.status,
            answerText: a.text,
            criteria: a.question.criteria,
            category: a.question.category,
            maxPoints: a.question.points,
          })),
        }))}
      />
    </AppShell>
  );
}
