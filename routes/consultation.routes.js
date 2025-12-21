import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ REGISTRAR CONSULTA
 * SOLO DOCTOR
 */
router.post(
  "/",
  verifyToken,
  checkRole("DOCTOR"),
  async (req, res) => {
    try {
      const { patient_id, diagnosis, observations, treatment } = req.body;

      // ✅ Verificar que el paciente exista
      const patient = await prisma.patient.findUnique({
        where: { id: Number(patient_id) },
      });

      if (!patient) {
        return res.status(400).json({ error: "Paciente no existe" });
      }

      const consultation = await prisma.consultation.create({
        data: {
          patient_id: Number(patient_id),
          doctor_id: req.user.id, // ✅ del token
          diagnosis,
          observations,
          treatment,
        },
      });

      res.json(consultation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al registrar consulta" });
    }
  }
);




/**
 * ✅ LISTAR TODAS LAS CONSULTAS
 * ADMIN, DOCTOR
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN", "DOCTOR"),
  async (req, res) => {
    try {
      const consultations = await prisma.consultation.findMany({
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      res.json(consultations);
    } catch (error) {
      res.status(500).json({ error: "Error al listar consultas" });
    }
  }
);

/**
 * ✅ CONSULTAS POR PACIENTE
 * ADMIN, DOCTOR
 */
router.get(
  "/patient/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const consultations = await prisma.consultation.findMany({
        where: {
          patient_id: Number(id),
        },
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      res.json(consultations);
    } catch (error) {
      res.status(500).json({ error: "Error al listar consultas del paciente" });
    }
  }
);

/**
 * ✅ CONSULTAS ATIENDE CITA NO ASIGNADA
 * DOCTOR
 */
router.post(
  '/from-appointment/:id',
  verifyToken,
  checkRole('DOCTOR'),
  async (req, res) => {
    const appointmentId = Number(req.params.id);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const consultation = await prisma.consultation.create({
      data: {
        patient_id: appointment.patient_id,
        doctor_id: req.user.id,
        diagnosis: '',
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'ATTENDED' },
    });

    res.json(consultation);
  }
);


export default router;
