const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const PREFIXES = ["e2e_", "dino_", "phys_", "s2_", "iv_", "bi_", "shot_"];
(async () => {
  const stale = await p.callSession.findMany({
    where: {
      status: "active",
      assignment: {
        user: { OR: PREFIXES.map((s) => ({ login: { startsWith: s } })) },
      },
    },
  });
  for (const s of stale) {
    await p.answer.deleteMany({ where: { sessionId: s.id } });
    await p.callDecision.deleteMany({ where: { sessionId: s.id } });
    await p.callSession.delete({ where: { id: s.id } });
    await p.callAssignment.deleteMany({ where: { id: s.assignmentId } });
  }
  console.log("cleaned stale sessions:", stale.length);
  const users = await p.user.deleteMany({
    where: { OR: PREFIXES.map((s) => ({ login: { startsWith: s } })) },
  });
  console.log("removed test users:", users.count);
  await p.$disconnect();
})();
