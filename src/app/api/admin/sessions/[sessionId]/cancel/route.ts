import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireCapability("calls.create");
    const body = (await req.json()) as { reason?: string };
    if (!body.reason || !body.reason.trim()) return fail("Укажите причину отмены");

    const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
    if (!session) return fail("Сессия не найдена", 404);
    if (session.status === "completed" || session.status === "cancelled") {
      return fail("Сессия уже закрыта", 409);
    }

    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: "cancelled", cancelReason: body.reason.trim(), finishedAt: new Date() },
    });
    await audit(user.id, "calls.session.cancel", "call_session", sessionId, body.reason.trim());
    return ok({ cancelled: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
