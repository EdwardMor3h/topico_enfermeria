import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ===========================================
 * 1️⃣ CREAR PACIENTE
 * Solo ADMIN y ENFERMERA pueden registrar
 * ===========================================
 */
router.post(
  "/",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  auditAction("CREAR", "PATIENT"),
  async (req, res) => {
    try {
      const { dni, first_name, last_name } = req.body;

      // Validación mínima
      if (!dni || !first_name || !last_name) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      // Verificar si existe DNI
      const exists = await prisma.patient.findUnique({
        where: { dni },
      });

      if (exists) {
        return res.status(400).json({ error: "El DNI ya está registrado" });
      }

      const patient = await prisma.patient.create({
        data: req.body,
      });

      res.json(patient);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear paciente" });
    }
  }
);

/**
 * ===========================================
 * 2️⃣ LISTAR PACIENTES
 * Todos los roles pueden ver
 * ADMIN | DOCTOR | NURSE
 * ===========================================
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("LISTAR", "PATIENT"),
  async (req, res) => {
    try {
      const patients = await prisma.patient.findMany({
        orderBy: { created_at: "desc" },
      });

      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Error al listar pacientes" });
    }
  }
);

/**
 * ===========================================
 * 3️⃣ OBTENER UN PACIENTE POR ID
 * ===========================================
 */
router.get(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("VER", "PATIENT"),
  async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: Number(req.params.id) },
      });

      if (!patient) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener paciente" });
    }
  }
);

/**
 * ===========================================
 * 4️⃣ ACTUALIZAR PACIENTE
 * Solo ADMIN y NURSE
 * ===========================================
 */
router.put(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  auditAction("ACTUALIZAR", "PATIENT"),
  async (req, res) => {
    try {
      const updated = await prisma.patient.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar paciente" });
    }
  }
);

/**
 * ===========================================
 * 5️⃣ ELIMINAR PACIENTE (soft delete)
 * Solo ADMIN
 * ===========================================
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole("ADMIN"),
  auditAction("ELIMINAR", "PATIENT"),
  async (req, res) => {
    try {
      const deleted = await prisma.patient.update({
        where: { id: Number(req.params.id) },
        data: { deleted_at: new Date() },
      });

      res.json({ message: "Paciente eliminado", deleted });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar paciente" });
    }
  }
);

export default router;
