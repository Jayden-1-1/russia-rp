import { NextRequest } from "next/server";
import { requireCapability, AuthError } from "@/lib/auth";
import { startSession } from "@/lib/calls";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    // Кандидат сам стартует свою сессию; проверка прав calls.take
    const user = await requireCapability("calls.take");
    // Администрация (root / проверяющие) не проходит обзвоны — она их проводит
    if (
      user.isRootAdmin ||
      user.capabilities.includes("results.grade") ||
      user.capabilities.includes("candidates.manage")
    ) {
      return fail("Администрация не проходит обзвоны — только проводит их", 403);
    }
    const assignment = await prisma.callAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.userId !== user.id) {
      return fail("Назначение не найдено", 404);
    }
    const session = await startSession(assignmentId, null);
    await audit(user.id, "calls.session.start", "call_session", session.id);
    return ok({ sessionId: session.id });
  } catch (e) {
    if (e instanceof Error && !(e instanceof AuthError)) {
      return fail(e.message, 400);
    }
    return handleAuthError(e);
  }
}
