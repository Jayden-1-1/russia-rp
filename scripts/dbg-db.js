const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const asg = await p.callAssignment.findMany({
    include: { user: { select: { login: true, isRootAdmin: true } } },
  });
  console.log(
    JSON.stringify(
      asg.map((a) => ({
        id: a.id.slice(-6),
        user: a.user.login,
        root: a.user.isRootAdmin,
        status: a.status,
      })),
      null,
      1
    )
  );
  await p.$disconnect();
})();
