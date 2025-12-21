import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ LISTAR LOGS DE AUDITORÍA
 * SOLO ADMIN
 */
router.get("/", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener auditorías" });
  }
});

/**
 * 🔍 FILTRAR POR ENTIDAD: PATIENT, CONSULTATION, SALE, etc.
 */
router.get("/entity/:name", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entity: req.params.name.toUpperCase() },
      include: {
        user: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error filtrando auditorías" });
  }
});

/**
 * 🔍 FILTRAR POR USUARIO
 */
router.get("/user/:id", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { user_id: Number(req.params.id) },
      include: {
        user: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error filtrando auditorías" });
  }
});

export default router;
