import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ CREAR PROCEDIMIENTO
 * Solo ADMIN
 */
router.post(
  "/",
  verifyToken,
  checkRole("ADMIN"),
  async (req, res) => {
    try {
      const { name, description, cost } = req.body;

      if (!name || !cost) {
        return res.status(400).json({ error: "Nombre y costo son obligatorios" });
      }

      const procedure = await prisma.procedure.create({
        data: {
          name,
          description,
          cost: Number(cost),
        },
      });

      res.json(procedure);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear procedimiento" });
    }
  }
);

/**
 * ✅ LISTAR PROCEDIMIENTOS
 * ADMIN - DOCTOR - NURSE
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  async (req, res) => {
    try {
      const procedures = await prisma.procedure.findMany({
        orderBy: { created_at: "desc" },
      });

      res.json(procedures);
    } catch (error) {
      res.status(500).json({ error: "Error al listar procedimientos" });
    }
  }
);

/**
 * ✅ ASIGNAR PROCEDIMIENTO A PACIENTE
 * NURSE - DOCTOR
 */
router.post(
  "/assign",
  verifyToken,
  checkRole("NURSE", "DOCTOR"),
  async (req, res) => {
    try {
      const { patient_id, procedure_id, date, observations } = req.body;

      if (!patient_id || !procedure_id || !date) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      const record = await prisma.procedureRecord.create({
        data: {
          patient_id,
          procedure_id,
          user_id: req.user.id,
          date: new Date(date),
          observations,
        },
      });

      res.json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al registrar procedimiento" });
    }
  }
);

/**
 * ✅ HISTORIAL DE PROCEDIMIENTOS POR PACIENTE
 * ADMIN - DOCTOR - NURSE
 */
router.get(
  "/patient/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  async (req, res) => {
    try {
      const patientId = Number(req.params.id);

      const records = await prisma.procedureRecord.findMany({
        where: { patient_id: patientId },
        include: {
          patient: true,
          procedure: true,
          user: true,
        },
        orderBy: { date: "desc" },
      });

      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Error al listar procedimientos del paciente" });
    }
  }
);

export default router;
