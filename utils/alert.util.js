import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createAlert(message, level = "INFO") {
  try {
    await prisma.alert.create({
      data: { message, level },
    });
    console.log(`🔔 ALERTA (${level}): ${message}`);
  } catch (error) {
    console.error("Error creando alerta:", error);
  }
}
