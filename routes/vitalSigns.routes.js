// routes/vitalSigns.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ===============================================
 * POST /api/vital-signs
 * Registrar signos vitales para una cita (NURSE)
 * ===============================================
 */
router.post(
  "/",
  verifyToken,
  checkRole("NURSE", "ADMIN"),
  auditAction("CREAR", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const {
        appointment_id,
        patient_id,
        blood_pressure,
        heart_rate,
        respiratory_rate,
        temperature,
        weight,
        height,
        oxygen_saturation,
        observations
      } = req.body;

      const nurse_id = req.user.id;

      // Validar que la cita existe y está programada
      const appointment = await prisma.appointment.findUnique({
        where: { id: Number(appointment_id) }
      });

      if (!appointment) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (appointment.status !== "SCHEDULED") {
        return res.status(400).json({
          error: "Solo se pueden registrar signos vitales para citas programadas"
        });
      }

      // Verificar si ya existen signos vitales
      const existingVitalSigns = await prisma.vitalSigns.findUnique({
        where: { appointment_id: Number(appointment_id) }
      });

      if (existingVitalSigns) {
        return res.status(400).json({
          error: "Esta cita ya tiene signos vitales. Use PUT para actualizar."
        });
      }

      // Crear signos vitales
      const vitalSigns = await prisma.vitalSigns.create({
        data: {
          appointment_id: Number(appointment_id),
          patient_id: Number(patient_id),
          nurse_id,
          blood_pressure,
          heart_rate: heart_rate ? parseInt(heart_rate) : null,
          respiratory_rate: respiratory_rate ? parseInt(respiratory_rate) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          oxygen_saturation: oxygen_saturation ? parseFloat(oxygen_saturation) : null,
          observations
        },
        include: {
          patient: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              dni: true
            }
          },
          nurse: {
            select: {
              id: true,
              full_name: true
            }
          }
        }
      });

      res.status(201).json({
        message: "Signos vitales registrados exitosamente",
        data: vitalSigns
      });

    } catch (error) {
      console.error("Error al registrar signos vitales:", error);
      res.status(500).json({
        error: "Error al registrar signos vitales",
        details: error.message
      });
    }
  }
);

/**
 * ===============================================
 * GET /api/vital-signs/appointment/:appointmentId
 * Obtener signos vitales de una cita (DOCTOR/NURSE)
 * ===============================================
 */
router.get(
  "/appointment/:appointmentId",
  verifyToken,
  checkRole("DOCTOR", "NURSE", "ADMIN"),
  auditAction("VER", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const vitalSigns = await prisma.vitalSigns.findUnique({
        where: {
          appointment_id: parseInt(appointmentId)
        },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              antecedents: true,
              phone: true
            }
          },
          nurse: {
            select: {
              id: true,
              full_name: true
            }
          },
          appointment: {
            select: {
              id: true,
              date: true,
              status: true,
              reason: true
            }
          }
        }
      });

      if (!vitalSigns) {
        return res.status(404).json({
          error: "No se encontraron signos vitales para esta cita"
        });
      }

      res.json({
        message: "Signos vitales obtenidos exitosamente",
        data: vitalSigns
      });

    } catch (error) {
      console.error("Error al obtener signos vitales:", error);
      res.status(500).json({
        error: "Error al obtener signos vitales",
        details: error.message
      });
    }
  }
);

/**
 * ===============================================
 * GET /api/vital-signs/patient/:patientId
 * Historial de signos vitales de un paciente
 * ===============================================
 */
router.get(
  "/patient/:patientId",
  verifyToken,
  checkRole("DOCTOR", "NURSE", "ADMIN"),
  auditAction("LISTAR_HISTORIAL", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { limit = 10 } = req.query;

      const vitalSigns = await prisma.vitalSigns.findMany({
        where: {
          patient_id: parseInt(patientId)
        },
        include: {
          nurse: {
            select: {
              full_name: true
            }
          },
          appointment: {
            select: {
              date: true,
              reason: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        },
        take: parseInt(limit)
      });

      res.json({
        message: "Historial de signos vitales obtenido exitosamente",
        count: vitalSigns.length,
        data: vitalSigns
      });

    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({
        error: "Error al obtener historial",
        details: error.message
      });
    }
  }
);

/**
 * ===============================================
 * PUT /api/vital-signs/:id
 * Actualizar signos vitales (NURSE)
 * ===============================================
 */
router.put(
  "/:id",
  verifyToken,
  checkRole("NURSE", "ADMIN"),
  auditAction("ACTUALIZAR", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        blood_pressure,
        heart_rate,
        respiratory_rate,
        temperature,
        weight,
        height,
        oxygen_saturation,
        observations
      } = req.body;

      // Verificar que existen
      const existingVitalSigns = await prisma.vitalSigns.findUnique({
        where: { id: parseInt(id) },
        include: {
          appointment: true
        }
      });

      if (!existingVitalSigns) {
        return res.status(404).json({ error: "Signos vitales no encontrados" });
      }

      // No permitir modificar si la cita ya fue atendida
      if (existingVitalSigns.appointment.status === "ATTENDED") {
        return res.status(400).json({
          error: "No se pueden modificar signos vitales de citas atendidas"
        });
      }

      // Actualizar
      const updatedVitalSigns = await prisma.vitalSigns.update({
        where: { id: parseInt(id) },
        data: {
          blood_pressure,
          heart_rate: heart_rate ? parseInt(heart_rate) : undefined,
          respiratory_rate: respiratory_rate ? parseInt(respiratory_rate) : undefined,
          temperature: temperature ? parseFloat(temperature) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          oxygen_saturation: oxygen_saturation ? parseFloat(oxygen_saturation) : undefined,
          observations
        },
        include: {
          patient: true,
          nurse: true
        }
      });

      res.json({
        message: "Signos vitales actualizados exitosamente",
        data: updatedVitalSigns
      });

    } catch (error) {
      console.error("Error al actualizar:", error);
      res.status(500).json({
        error: "Error al actualizar signos vitales",
        details: error.message
      });
    }
  }
);

/**
 * ===============================================
 * DELETE /api/vital-signs/:id
 * Eliminar signos vitales (ADMIN)
 * ===============================================
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole("ADMIN"),
  auditAction("ELIMINAR", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.vitalSigns.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        message: "Signos vitales eliminados exitosamente"
      });

    } catch (error) {
      console.error("Error al eliminar:", error);
      res.status(500).json({
        error: "Error al eliminar signos vitales",
        details: error.message
      });
    }
  }
);

/**
 * ===============================================
 * GET /api/vital-signs
 * Listar todos los signos vitales (ADMIN)
 * ===============================================
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN"),
  auditAction("LISTAR_TODOS", "VITAL_SIGNS"),
  async (req, res) => {
    try {
      const vitalSigns = await prisma.vitalSigns.findMany({
        include: {
          patient: {
            select: {
              first_name: true,
              last_name: true,
              dni: true
            }
          },
          nurse: {
            select: {
              full_name: true
            }
          },
          appointment: {
            select: {
              date: true,
              status: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      });

      res.json({
        message: "Lista completa de signos vitales",
        count: vitalSigns.length,
        data: vitalSigns
      });

    } catch (error) {
      console.error("Error al listar:", error);
      res.status(500).json({
        error: "Error al listar signos vitales",
        details: error.message
      });
    }
  }
);

export default router;