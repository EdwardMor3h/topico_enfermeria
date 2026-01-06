import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ===========================================
 * 1️⃣ CREAR PACIENTE
 * ADMIN | NURSE
 * ===========================================
 */
router.post(
  "/",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  auditAction("CREAR", "PATIENT"),
  async (req, res) => {
    try {
      let {
        dni,
        first_name,
        last_name,
        age,
        phone,
        address,
        antecedents,
        date_of_birth,
        place_of_origin,
        email
      } = req.body;

      // 🧼 LIMPIAR DATOS
      dni = dni?.trim();
      first_name = first_name?.trim();
      last_name = last_name?.trim();
      phone = phone?.trim() || null;
      address = address?.trim() || null;
      antecedents = antecedents?.trim() || null;
      place_of_origin = place_of_origin?.trim() || null;
      email = email?.trim() || null;

      // ❌ VALIDACIÓN BÁSICA
      if (!dni || !first_name || !last_name) {
        return res.status(400).json({
          error: "DNI, nombres y apellidos son obligatorios"
        });
      }

      // ❌ DNI solo números (8 dígitos)
      if (!/^[0-9]{8}$/.test(dni)) {
        return res.status(400).json({ error: "DNI inválido" });
      }

      // ❌ DNI duplicado
      const exists = await prisma.patient.findUnique({
        where: { dni }
      });

      if (exists) {
        return res.status(400).json({ error: "El DNI ya está registrado" });
      }

      // 📅 FECHA SEGURA
      const parsedDate =
        date_of_birth && !isNaN(Date.parse(date_of_birth))
          ? new Date(date_of_birth)
          : null;

      // 🔢 EDAD SEGURA
      const parsedAge = Number.isInteger(Number(age))
        ? Number(age)
        : null;

      // ✅ CREAR PACIENTE
      const patient = await prisma.patient.create({
        data: {
          dni,
          first_name,
          last_name,
          age: parsedAge,
          phone,
          address,
          antecedents,
          date_of_birth: parsedDate,
          place_of_origin,
          email
        }
      });

      res.json({
        message: "Paciente creado exitosamente",
        data: patient
      });
    } catch (error) {
      console.error("Error al crear paciente:", error);
      res.status(500).json({ error: "Error al crear paciente" });
    }
  }
);

/**
 * ===========================================
 * 2️⃣ LISTAR PACIENTES
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
        where: { deleted_at: null },
        orderBy: { created_at: "desc" }
      });

      res.json(patients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al listar pacientes" });
    }
  }
);

/**
 * ===========================================
 * 3️⃣ OBTENER PACIENTE POR ID
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
        where: { id: Number(req.params.id) }
      });

      if (!patient || patient.deleted_at) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      res.json(patient);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al obtener paciente" });
    }
  }
);

/**
 * ===========================================
 * 4️⃣ ACTUALIZAR PACIENTE
 * ADMIN | NURSE
 * ===========================================
 */
router.put(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  auditAction("ACTUALIZAR", "PATIENT"),
  async (req, res) => {
    try {
      let {
        dni,
        first_name,
        last_name,
        age,
        phone,
        address,
        antecedents,
        date_of_birth,
        place_of_origin,
        email
      } = req.body;

      // 🧼 LIMPIAR
      dni = dni?.trim();
      first_name = first_name?.trim();
      last_name = last_name?.trim();

      const parsedAge = Number.isInteger(Number(age))
        ? Number(age)
        : null;

      const parsedDate =
        date_of_birth && !isNaN(Date.parse(date_of_birth))
          ? new Date(date_of_birth)
          : null;

      const updated = await prisma.patient.update({
        where: { id: Number(req.params.id) },
        data: {
          dni,
          first_name,
          last_name,
          age: parsedAge,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          antecedents: antecedents?.trim() || null,
          date_of_birth: parsedDate,
          place_of_origin: place_of_origin?.trim() || null,
          email: email?.trim() || null
        }
      });

      res.json({
        message: "Paciente actualizado exitosamente",
        data: updated
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar paciente" });
    }
  }
);

/**
 * ===========================================
 * 5️⃣ ELIMINAR PACIENTE (soft delete)
 * ADMIN
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
        data: { deleted_at: new Date() }
      });

      res.json({ message: "Paciente eliminado", data: deleted });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al eliminar paciente" });
    }
  }
);

export default router;
