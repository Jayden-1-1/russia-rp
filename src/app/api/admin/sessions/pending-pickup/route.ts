import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleAuthError } from "@/lib/api";

/**
 * Активные обзвоны, которые никто из проверяющих ещё не взял.
 * Для всплывающего окна «Взять обзвон» у администрации.
 */
export async function GET() {
  try {
    await requireCapability("results.grade");
    const sessions = await prisma.callSession.findMany({
      where: { status: "active", examinerId: null },
      include: {
        assignment: {
          include: {
            user: { select: { login: true, displayName: true } },
            template: { select: { category: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
    return ok({
      pending: sessions.map((s) => ({
        sessionId: s.id,
        candidate: s.assignment.user.displayName ?? s.assignment.user.login,
        category: s.assignment.template.category,
        startedAt: s.startedAt.toISOString(),
      })),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
