const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({
    where: {
      OR: [
        { isRootAdmin: true },
        {
          roleBindings: {
            some: {
              role: {
                permissions: {
                  some: { capability: { in: ["results.grade", "candidates.manage"] }, allowed: true },
                },
              },
            },
          },
        },
      ],
    },
  });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    const asg = await p.callAssignment.findMany({ where: { userId: { in: ids } } });
    for (const a of asg) {
      const sessions = await p.callSession.findMany({ where: { assignmentId: a.id } });
      for (const s of sessions) {
        await p.answer.deleteMany({ where: { sessionId: s.id } });
        await p.callDecision.deleteMany({ where: { sessionId: s.id } });
        await p.callSession.delete({ where: { id: s.id } });
      }
      await p.callAssignment.delete({ where: { id: a.id } });
    }
  }
  console.log("cleaned assignments for:", users.map((u) => u.login));
  await p.$disconnect();
})();
