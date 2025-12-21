import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import {
  requireFields,
  validateDate,
  validateEnum,
  validateId,
} from "../middlewares/validation.middleware.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ===========================================
 *   CREAR CITA → ADMIN y NURSE
 * ===========================================
 */
router.post(
  "/",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  requireFields(["patient_id", "date"]),
  validateDate("date"),
  auditAction("CREAR", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { patient_id, date, reason } = req.body;

      const patient = await prisma.patient.findUnique({
        where: { id: Number(patient_id) },
      });

      if (!patient) {
        return res.status(400).json({ error: "El paciente no existe" });
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: { date: new Date(date) },
      });

      if (existingAppointment) {
        return res.status(400).json({
          error: "Ya existe una cita en ese horario",
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          patient_id: Number(patient_id),
          date: new Date(date),
          reason,
          status: "SCHEDULED",
        },
      });

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * ===========================================
 *   LISTAR CITAS → ADMIN, NURSE, DOCTOR
 * ===========================================
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN", "NURSE", "DOCTOR"),
  auditAction("LISTAR", "APPOINTMENT"),
  async (req, res) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: { patient: true },
        orderBy: { date: "asc" },
      });

      res.json(appointments);
    } catch (error) {
      console.error("ERROR REAL:", error);
      res.status(500).json({ error: "Error al listar citas" });
    }
  }
);

/**
 * ===========================================
 *   MIS CITAS ASIGNADAS (DOCTOR)
 * ===========================================
 */
router.get(
  '/my',
  verifyToken,
  checkRole('DOCTOR'),
  async (req, res) => {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
        },
        include: {
          patient: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener mis citas' });
    }
  }
);

/**
 * ===========================================
 *   CITAS DEL DÍA → TODOS
 * ===========================================
 */
router.get(
  "/today",
  verifyToken,
  checkRole("ADMIN", "NURSE", "DOCTOR"),
  auditAction("LISTAR_TODAY", "APPOINTMENT"),
  async (req, res) => {
    try {
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));

      const appointments = await prisma.appointment.findMany({
        where: { date: { gte: start, lte: end } },
        include: { patient: true },
        orderBy: { date: "asc" },
      });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener citas del día" });
    }
  }
);

/**
 * ===========================================
 *   CITAS POR PACIENTE → TODOS
 * ===========================================
 */
router.get(
  "/patient/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE", "DOCTOR"),
  validateId,
  auditAction("LISTAR_POR_PACIENTE", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const appointments = await prisma.appointment.findMany({
        where: { patient_id: Number(id) },
        include: { patient: true },
        orderBy: { date: "desc" },
      });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Error al listar citas del paciente" });
    }
  }
);

/**
 * ===========================================
 *   OBTENER CITA POR ID → ADMIN, NURSE, DOCTOR
 * ===========================================
 */
router.get(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE", "DOCTOR"),
  validateId,
  auditAction("VER", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id: Number(id) },
        include: { patient: true },
      });

      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error obteniendo cita:", error);
      res.status(500).json({ error: "Error al obtener cita" });
    }
  }
);

/**
 * ===========================================
 *   ACTUALIZAR CITA COMPLETA → ADMIN y NURSE
 * ===========================================
 */
router.put(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  validateId,
  requireFields(["patient_id", "date"]),
  validateDate("date"),
  auditAction("ACTUALIZAR", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { patient_id, date, reason } = req.body;

      const updated = await prisma.appointment.update({
        where: { id: Number(id) },
        data: {
          patient_id: Number(patient_id),
          date: new Date(date),
          reason,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar cita" });
    }
  }
);

/**
 * ===========================================
 *   CAMBIAR ESTADO → ADMIN, NURSE, DOCTOR (✅ AGREGUÉ DOCTOR)
 * ===========================================
 */
router.put(
  "/:id/status",
  verifyToken,
  checkRole("ADMIN", "NURSE", "DOCTOR"), // ✅ Agregué DOCTOR
  validateId,
  validateEnum("status", ["SCHEDULED", "ATTENDED", "CANCELLED"]),
  auditAction("ACTUALIZAR_ESTADO", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await prisma.appointment.update({
        where: { id: Number(id) },
        data: { status },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error actualizando estado:", error);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  }
);

/**
 * ===========================================
 *   ANULAR CITA → ADMIN y NURSE
 * ===========================================
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  validateId,
  auditAction("ANULAR", "APPOINTMENT"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await prisma.appointment.update({
        where: { id: Number(id) },
        data: { status: "CANCELLED" },
      });

      res.json({ message: "Cita anulada", deleted });
    } catch (error) {
      res.status(500).json({ error: "Error al anular cita" });
    }
  }
);

export default router;
