const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const sessions = await p.callSession.findMany({
    orderBy: { startedAt: "desc" },
    take: 5,
    include: {
      _count: { select: { answers: true } },
      assignment: { include: { user: { select: { login: true } } } },
      decisions: true,
    },
  });
  for (const s of sessions) {
    console.log(
      s.id.slice(-6),
      s.status,
      "answers:" + s._count.answers,
      "user:" + s.assignment.user.login,
      "decision:" + (s.decisions[0] ? s.decisions[0].decision + " " + s.decisions[0].score : "none")
    );
  }
  await p.$disconnect();
})();
