import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AnimatedGrid from "@/components/AnimatedGrid";
import WaitClient from "./WaitClient";

export const dynamic = "force-dynamic";

/** Страница ожидания обзвона: кандидат заходит по ключу и ждёт назначения. */
export default async function WaitPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assignment = await prisma.callAssignment.findFirst({
    where: { userId: user.id, status: "assigned" },
    include: { sessions: { where: { status: "active" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="relative min-h-dvh bg-ink flex items-center justify-center px-6">
      <AnimatedGrid aria-hidden />
      <WaitClient
        initial={
          assignment
            ? {
                assignmentId: assignment.id,
                active: Boolean(assignment.sessions[0]),
              }
            : null
        }
      />
    </div>
  );
}
