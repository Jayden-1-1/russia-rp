import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleAuthError } from "@/lib/api";

/**
 * Кандидаты, готовые ко 2 туру (практике) — для уведомления проводящих.
 */
export async function GET() {
  try {
    await requireCapability("results.grade");
    const sessions = await prisma.callSession.findMany({
      where: {
        status: "active",
        stage: 1,
        stage2ReadyAt: { not: null },
        practiceStartedAt: null,
      },
      include: {
        assignment: {
          include: {
            user: { select: { login: true, displayName: true } },
            template: { select: { category: true } },
          },
        },
      },
      orderBy: { stage2ReadyAt: "asc" },
      take: 20,
    });
    return ok({
      pending: sessions.map((s) => ({
        sessionId: s.id,
        candidate: s.assignment.user.displayName ?? s.assignment.user.login,
        category: s.assignment.template.category,
        readyAt: s.stage2ReadyAt!.toISOString(),
      })),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
