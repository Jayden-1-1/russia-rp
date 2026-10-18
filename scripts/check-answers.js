const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const s = await p.callSession.findFirst({
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { answers: true } }, examiner: true },
  });
  if (!s) {
    console.log("no sessions");
  } else {
    console.log(
      "latest session:",
      s.status,
      "answers:",
      s._count.answers,
      "examiner:",
      s.examiner ? s.examiner.login : null
    );
  }
  await p.$disconnect();
})();
