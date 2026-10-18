const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  // Сессии без единого ответа — сломанные (созданы до фикса)
  const broken = await p.callSession.findMany({
    where: { answers: { none: {} }, status: { in: ["active", "awaiting_review"] } },
  });
  for (const s of broken) {
    await p.callDecision.deleteMany({ where: { sessionId: s.id } });
    await p.callSession.delete({ where: { id: s.id } });
    await p.callAssignment.deleteMany({ where: { id: s.assignmentId } });
  }
  console.log("removed broken sessions:", broken.length);
  await p.$disconnect();
})();
