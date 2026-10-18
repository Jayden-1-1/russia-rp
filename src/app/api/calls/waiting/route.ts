import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleAuthError } from "@/lib/api";
import { AuthError } from "@/lib/auth";

/** Статус ожидания обзвона для текущего пользователя. */
export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError("UNAUTHORIZED", 401);

    const assignment = await prisma.callAssignment.findFirst({
      where: { userId: user.id, status: "assigned" },
      include: { sessions: { where: { status: "active" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    if (!assignment) return ok({ assignment: null });
    return ok({
      assignment: {
        assignmentId: assignment.id,
        active: Boolean(assignment.sessions[0]),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail("Требуется вход", 401);
    return handleAuthError(e);
  }
}
