import { prisma } from "@/lib/db";

export async function audit(
  userId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string,
  ip?: string
) {
  await prisma.auditLog
    .create({
      data: { userId, action, entity, entityId, details, ip },
    })
    .catch(() => {}); // журнал не должен ломать основной поток
}
