// routes/consultation.routes.js - CORREGIDO CON CAMPOS COMPLETOS DEL PACIENTE
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { createAlert } from "../utils/alert.util.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ CREAR CONSULTA + HISTORIA CLÍNICA AUTOMÁTICA
 */
router.post(
  "/",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("CREAR", "CONSULTATION"),
  async (req, res) => {
    try {
      const { patient_id, diagnosis, observations, treatment } = req.body;
      const doctor_id = req.user.id;

      if (!patient_id || !diagnosis || !treatment) {
        return res.status(400).json({
          error: "patient_id, diagnosis y treatment son requeridos"
        });
      }

      const patient = await prisma.patient.findUnique({
        where: { id: Number(patient_id) }
      });

      if (!patient) {
        await createAlert("Intento de consulta con paciente inexistente", "WARNING");
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      // 🩺 CREAR CONSULTA
      const consultation = await prisma.consultation.create({
        data: {
          patient_id: Number(patient_id),
          doctor_id,
          diagnosis,
          observations: observations || null,
          treatment
        },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              phone: true,
              address: true,
              // ⬇️ CAMPOS NUEVOS INCLUIDOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              full_name: true
            }
          }
        }
      });

      // 🔍 BUSCAR CITA MÁS RECIENTE PARA SIGNOS VITALES
      const recentAppointment = await prisma.appointment.findFirst({
        where: {
          patient_id: Number(patient_id),
          status: "SCHEDULED"
        },
        include: {
          vitalSigns: true
        },
        orderBy: {
          date: "desc"
        }
      });

      // 📋 CREAR HISTORIA CLÍNICA AUTOMÁTICAMENTE
      const clinicalHistory = await prisma.clinicalHistory.create({
        data: {
          consultation_id: consultation.id,
          patient_id: Number(patient_id),
          doctor_id,
          diagnosis,
          blood_pressure: recentAppointment?.vitalSigns?.blood_pressure || null,
          heart_rate: recentAppointment?.vitalSigns?.heart_rate || null,
          respiratory_rate: recentAppointment?.vitalSigns?.respiratory_rate || null,
          temperature: recentAppointment?.vitalSigns?.temperature || null,
          weight: recentAppointment?.vitalSigns?.weight || null,
          height: recentAppointment?.vitalSigns?.height || null, // ⬅️ AGREGADA LA TALLA
          oxygen_saturation: recentAppointment?.vitalSigns?.oxygen_saturation || null,
          medical_signature: null
        },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              phone: true,
              address: true,
              // ⬇️ CAMPOS NUEVOS INCLUIDOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: true
        }
      });

      await createAlert(
        `Consulta e historia clínica creadas por Dr. ${req.user.full_name || doctor_id} para paciente ${patient.first_name} ${patient.last_name} (DNI: ${patient.dni})`,
        "INFO"
      );

      res.status(201).json({
        message: "Consulta e historia clínica creadas exitosamente",
        consultation,
        clinicalHistory
      });

    } catch (error) {
      console.error("Error al crear consulta:", error);
      await createAlert(
        `Error crítico al crear consulta: ${error.message}`,
        "CRITICAL"
      );
      res.status(500).json({ 
        error: "Error al crear la consulta",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * ✅ LISTAR TODAS LAS CONSULTAS
 */
router.get(
  "/",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("LISTAR", "CONSULTATION"),
  async (req, res) => {
    try {
      const consultations = await prisma.consultation.findMany({
        where: {
          deleted_at: null
        },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              phone: true,
              address: true,
              // ⬇️ CAMPOS NUEVOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              full_name: true
            }
          },
          clinicalHistory: {
            select: {
              id: true,
              medical_signature: true,
              created_at: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      });

      res.json({
        message: "Consultas obtenidas exitosamente",
        count: consultations.length,
        data: consultations
      });

    } catch (error) {
      console.error("Error al listar consultas:", error);
      res.status(500).json({ error: "Error al obtener consultas" });
    }
  }
);

/**
 * 🔍 OBTENER CONSULTA POR ID
 */
router.get(
  "/:id",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("VER", "CONSULTATION"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const consultation = await prisma.consultation.findUnique({
        where: { id: Number(id) },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              phone: true,
              address: true,
              antecedents: true,
              // ⬇️ CAMPOS NUEVOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true
            }
          },
          clinicalHistory: true
        }
      });

      if (!consultation || consultation.deleted_at) {
        return res.status(404).json({ error: "Consulta no encontrada" });
      }

      res.json({
        message: "Consulta obtenida exitosamente",
        data: consultation
      });

    } catch (error) {
      console.error("Error al obtener consulta:", error);
      res.status(500).json({ error: "Error al obtener consulta" });
    }
  }
);

/**
 * 👤 OBTENER CONSULTAS POR PACIENTE
 */
router.get(
  "/patient/:patientId",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("LISTAR_POR_PACIENTE", "CONSULTATION"),
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const consultations = await prisma.consultation.findMany({
        where: {
          patient_id: Number(patientId),
          deleted_at: null
        },
        include: {
          doctor: {
            select: {
              id: true,
              full_name: true
            }
          },
          clinicalHistory: {
            select: {
              id: true,
              medical_signature: true,
              created_at: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      });

      res.json({
        message: "Consultas del paciente obtenidas exitosamente",
        count: consultations.length,
        data: consultations
      });

    } catch (error) {
      console.error("Error al obtener consultas del paciente:", error);
      res.status(500).json({ error: "Error al obtener consultas" });
    }
  }
);

/**
 * ✏️ ACTUALIZAR CONSULTA
 */
router.put(
  "/:id",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("ACTUALIZAR", "CONSULTATION"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { diagnosis, observations, treatment } = req.body;

      const consultation = await prisma.consultation.findUnique({
        where: { id: Number(id) },
        include: {
          clinicalHistory: true
        }
      });

      if (!consultation || consultation.deleted_at) {
        return res.status(404).json({ error: "Consulta no encontrada" });
      }

      if (consultation.clinicalHistory?.medical_signature) {
        return res.status(400).json({
          error: "No se puede modificar una consulta con historia clínica firmada"
        });
      }

      const updatedConsultation = await prisma.consultation.update({
        where: { id: Number(id) },
        data: {
          diagnosis: diagnosis || undefined,
          observations: observations !== undefined ? observations : undefined,
          treatment: treatment || undefined
        },
        include: {
          patient: {
            select: {
              id: true,
              dni: true,
              first_name: true,
              last_name: true,
              age: true,
              phone: true,
              address: true,
              // ⬇️ CAMPOS NUEVOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: true,
          clinicalHistory: true
        }
      });

      if (consultation.clinicalHistory && diagnosis) {
        await prisma.clinicalHistory.update({
          where: { consultation_id: Number(id) },
          data: {
            diagnosis
          }
        });
      }

      await createAlert(
        `Consulta ${id} actualizada por ${req.user.full_name}`,
        "INFO"
      );

      res.json({
        message: "Consulta actualizada exitosamente",
        data: updatedConsultation
      });

    } catch (error) {
      console.error("Error al actualizar consulta:", error);
      res.status(500).json({ error: "Error al actualizar consulta" });
    }
  }
);

/**
 * 🗑️ ELIMINAR CONSULTA (SOFT DELETE)
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole("ADMIN"),
  auditAction("ELIMINAR", "CONSULTATION"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const consultation = await prisma.consultation.update({
        where: { id: Number(id) },
        data: {
          deleted_at: new Date()
        }
      });

      await createAlert(
        `Consulta ${id} eliminada por ${req.user.full_name}`,
        "WARNING"
      );

      res.json({
        message: "Consulta eliminada exitosamente",
        data: consultation
      });

    } catch (error) {
      console.error("Error al eliminar consulta:", error);
      res.status(500).json({ error: "Error al eliminar consulta" });
    }
  }
);

export default router;