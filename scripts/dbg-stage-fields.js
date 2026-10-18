const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const s = await p.callSession.findFirst({
    where: { status: "active" },
    orderBy: { startedAt: "desc" },
  });
  console.log(
    "stage:", s.stage,
    "| stage2ReadyAt:", s.stage2ReadyAt,
    "| practiceTaskId:", s.practiceTaskId
  );
  await p.$disconnect();
})();
