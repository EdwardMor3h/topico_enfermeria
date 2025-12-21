import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

router.get(
  "/",
  verifyToken,
  checkRole("ADMIN"),
  async (req, res) => {
    try {
      const alerts = await prisma.alert.findMany({
        orderBy: { created_at: "desc" },
      });
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener alertas" });
    }
  }
);

export default router;
