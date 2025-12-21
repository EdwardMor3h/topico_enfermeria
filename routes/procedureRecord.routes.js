import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

// ✅ Registrar procedimiento a paciente
router.post("/", verifyToken, async (req, res) => {
  try {
    const { patient_id, procedure_id, date, observations } = req.body;

    const record = await prisma.procedureRecord.create({
      data: {
        patient_id,
        procedure_id,
        user_id: req.user.id, // sale del token
        date: new Date(date),
        observations,
      },
    });

    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar procedimiento" });
  }
});

// ✅ Listar procedimientos realizados
router.get("/", verifyToken, async (req, res) => {
  try {
    const records = await prisma.procedureRecord.findMany({
      include: {
        patient: true,
        procedure: true,
        user: true,
      },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Error al listar procedimientos realizados" });
  }
});

export default router;
