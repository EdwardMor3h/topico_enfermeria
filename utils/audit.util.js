import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createAudit(req, action, entity, entity_id = null) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: req.user?.id || null,
        action,
        entity,
        entity_id,
        ip: req.ip,
        user_agent: req.headers["user-agent"],
      },
    });
  } catch (error) {
    console.error("❌ Error registrando auditoría:", error);
  }
}
