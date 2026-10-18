import { NextRequest } from "next/server";
import { requireCapability } from "@/lib/auth";
import { submitAnswer, skipAnswer } from "@/lib/calls";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ok, fail, handleAuthError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireCapability("calls.take");

    // Сессия принадлежит пользователю — серверная проверка
    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: { assignment: true },
    });
    if (!session || session.assignment.userId !== user.id) {
      return fail("Сессия не найдена", 404);
    }

    const body = (await req.json()) as {
      answerId: string;
      text?: string;
      boolValue?: boolean;
      skip?: boolean;
    };

    const result = body.skip
      ? await skipAnswer(sessionId, body.answerId)
      : await submitAnswer(sessionId, body.answerId, { text: body.text, boolValue: body.boolValue });

    if (result.accepted) {
      await audit(user.id, "calls.answer", "answer", body.answerId);
    }
    return ok(result);
  } catch (e) {
    return handleAuthError(e);
  }
}
