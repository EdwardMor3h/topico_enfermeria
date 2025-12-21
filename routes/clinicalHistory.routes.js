import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { createAlert } from "../utils/alert.util.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ REGISTRAR HISTORIA CLÍNICA
 * SOLO DOCTOR
 */
router.post(
  "/",
  verifyToken,
  checkRole("DOCTOR"),
  auditAction("CREAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const {
        consultation_id,
        patient_id,
        blood_pressure,
        heart_rate,
        respiratory_rate,
        temperature,
        weight,
        oxygen_saturation,
        diagnosis,
        medical_signature,
      } = req.body;

      // 🔎 Verificar consulta existente
      const consultation = await prisma.consultation.findUnique({
        where: { id: Number(consultation_id) },
      });

      if (!consultation) {
        createAlert(`Consulta inexistente para registrar historia`, "WARNING");
        return res.status(400).json({ error: "La consulta no existe" });
      }

      // 🔎 Validar duplicado
      const existingHistory = await prisma.clinicalHistory.findUnique({
        where: { consultation_id: Number(consultation_id) },
      });

      if (existingHistory) {
        createAlert(
          `Intento duplicado de historia clínica en consulta ${consultation_id}`,
          "WARNING"
        );
        return res.status(400).json({
          error: "Ya existe historia clínica para esta consulta",
        });
      }

      // 🩺 Crear historia clínica
      const history = await prisma.clinicalHistory.create({
        data: {
          consultation_id: Number(consultation_id),
          patient_id: Number(patient_id),
          doctor_id: req.user.id,

          blood_pressure,
          heart_rate,
          respiratory_rate,
          temperature,
          weight,
          oxygen_saturation,

          diagnosis,
          medical_signature,
        },
      });

      // 🔔 ALERTA
      createAlert(
        `El doctor ${req.user.id} registró historia clínica para el paciente ${patient_id} (consulta ${consultation_id})`,
        "INFO"
      );

      res.json(history);

    } catch (error) {
      console.error(error);
      createAlert(`Error al registrar historia clínica: ${error.message}`, "CRITICAL");
      res.status(500).json({ error: "Error al registrar historia clínica" });
    }
  }
);

/**
 * LISTAR HISTORIAS POR PACIENTE
 */
router.get(
  "/patient/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR"),
  auditAction("LISTAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const histories = await prisma.clinicalHistory.findMany({
        where: { patient_id: Number(id) },
        include: {
          doctor: true,
          consultation: true,
        },
        orderBy: { created_at: "desc" },
      });

      res.json(histories);
    } catch (error) {
      createAlert(`Error al listar historia del paciente ${req.params.id}`, "WARNING");
      res.status(500).json({ error: "Error al listar historia clínica" });
    }
  }
);

/**
 * VER HISTORIA POR CONSULTA
 */
router.get(
  "/consultation/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR"),
  auditAction("CONSULTAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const history = await prisma.clinicalHistory.findUnique({
        where: { consultation_id: Number(id) },
        include: {
          doctor: true,
          patient: true,
        },
      });

      res.json(history);
    } catch (error) {
      createAlert(`Error al obtener historia de consulta ${req.params.id}`, "WARNING");
      res.status(500).json({ error: "Error al obtener historia" });
    }
  }
);

export default router;
