const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const s = await p.callSession.findFirst({
    where: { status: "active" },
    orderBy: { startedAt: "desc" },
    include: { examiner: true, assignment: { include: { user: true } } },
  });
  console.log(
    "session:", s.id.slice(-6),
    "| examiner:", s.examiner ? s.examiner.login : null,
    "| stage2ReadyAt:", s.stage2ReadyAt,
    "| user:", s.assignment.user.login
  );
  await p.$disconnect();
})();
