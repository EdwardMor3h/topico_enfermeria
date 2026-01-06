// ========================================
// 📁 routes/clinicalHistory.routes.js - VERSIÓN COMPLETA Y CORREGIDA
// ========================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { createAlert } from "../utils/alert.util.js";
import { auditAction } from "../middlewares/audit.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ CREAR HISTORIA CLÍNICA (automático después de consulta)
 * SOLO DOCTOR
 */
router.post(
  "/",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
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
        height, // ⬅️ AGREGADO
        oxygen_saturation,
        diagnosis,
      } = req.body;

      // Verificar consulta existente
      const consultation = await prisma.consultation.findUnique({
        where: { id: Number(consultation_id) },
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
          }
        }
      });

      if (!consultation) {
        await createAlert("Consulta inexistente para registrar historia", "WARNING");
        return res.status(400).json({ error: "La consulta no existe" });
      }

      // Validar duplicado
      const existingHistory = await prisma.clinicalHistory.findUnique({
        where: { consultation_id: Number(consultation_id) },
      });

      if (existingHistory) {
        await createAlert(
          `Intento duplicado de historia clínica en consulta ${consultation_id}`,
          "WARNING"
        );
        return res.status(400).json({
          error: "Ya existe historia clínica para esta consulta",
        });
      }

      // Crear historia clínica (SIN firma aún)
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
          height, // ⬅️ AGREGADO
          oxygen_saturation,
          diagnosis,
          medical_signature: null, // Se firma después
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
          consultation: true
        }
      });

      await createAlert(
        `El doctor ${req.user.full_name || req.user.id} registró historia clínica para ${consultation.patient.first_name} ${consultation.patient.last_name}`,
        "INFO"
      );

      res.status(201).json({
        message: "Historia clínica creada exitosamente",
        data: history
      });

    } catch (error) {
      console.error("Error al registrar historia clínica:", error);
      await createAlert(
        `Error al registrar historia clínica: ${error.message}`,
        "CRITICAL"
      );
      res.status(500).json({ error: "Error al registrar historia clínica" });
    }
  }
);

/**
 * 📋 LISTAR TODAS LAS HISTORIAS CLÍNICAS
 * ADMIN, DOCTOR, NURSE
 */
router.get(
  "/",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("LISTAR_TODOS", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const histories = await prisma.clinicalHistory.findMany({
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
          consultation: {
            select: {
              id: true,
              diagnosis: true,
              treatment: true,
              observations: true,
              created_at: true
            }
          }
        },
        orderBy: { created_at: "desc" },
      });

      res.json({
        message: "Historias clínicas obtenidas exitosamente",
        count: histories.length,
        data: histories
      });

    } catch (error) {
      console.error("Error al listar historias:", error);
      await createAlert("Error al listar historias clínicas", "WARNING");
      res.status(500).json({ error: "Error al listar historias clínicas" });
    }
  }
);

/**
 * 🔍 OBTENER HISTORIA CLÍNICA POR ID
 * ADMIN, DOCTOR, NURSE
 */
router.get(
  "/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("VER", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const history = await prisma.clinicalHistory.findUnique({
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
          doctor: true,
          consultation: {
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
              }
            }
          }
        }
      });

      if (!history) {
        return res.status(404).json({ error: "Historia clínica no encontrada" });
      }

      res.json({
        message: "Historia clínica obtenida exitosamente",
        data: history
      });

    } catch (error) {
      console.error("Error al obtener historia:", error);
      res.status(500).json({ error: "Error al obtener historia clínica" });
    }
  }
);

/**
 * 👤 LISTAR HISTORIAS POR PACIENTE
 * ADMIN, DOCTOR, NURSE
 */
router.get(
  "/patient/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("LISTAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const histories = await prisma.clinicalHistory.findMany({
        where: { patient_id: Number(id) },
        include: {
          doctor: {
            select: {
              id: true,
              full_name: true
            }
          },
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
          consultation: {
            select: {
              id: true,
              diagnosis: true,
              treatment: true,
              observations: true,
              created_at: true
            }
          }
        },
        orderBy: { created_at: "desc" },
      });

      res.json(histories);

    } catch (error) {
      console.error("Error al listar historia del paciente:", error);
      await createAlert(
        `Error al listar historia del paciente ${req.params.id}`,
        "WARNING"
      );
      res.status(500).json({ error: "Error al listar historia clínica" });
    }
  }
);

/**
 * 📄 VER HISTORIA POR CONSULTA
 * ADMIN, DOCTOR, NURSE
 */
router.get(
  "/consultation/:id",
  verifyToken,
  checkRole("ADMIN", "DOCTOR", "NURSE"),
  auditAction("CONSULTAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const history = await prisma.clinicalHistory.findUnique({
        where: { consultation_id: Number(id) },
        include: {
          doctor: true,
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
          consultation: true
        },
      });

      if (!history) {
        return res.status(404).json({
          error: "No se encontró historia clínica para esta consulta"
        });
      }

      res.json({
        message: "Historia clínica obtenida exitosamente",
        data: history
      });

    } catch (error) {
      console.error("Error al obtener historia de consulta:", error);
      await createAlert(
        `Error al obtener historia de consulta ${req.params.id}`,
        "WARNING"
      );
      res.status(500).json({ error: "Error al obtener historia" });
    }
  }
);

/**
 * 🖊️ FIRMAR HISTORIA CLÍNICA
 * SOLO DOCTOR Y ADMIN
 */
router.post(
  "/:id/sign",
  verifyToken,
  checkRole("DOCTOR", "ADMIN"),
  auditAction("FIRMAR", "CLINICAL_HISTORY"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { signature } = req.body;

      if (!signature) {
        return res.status(400).json({ error: "La firma es requerida" });
      }

      // Verificar que la historia clínica existe
      const history = await prisma.clinicalHistory.findUnique({
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
              // ⬇️ CAMPOS NUEVOS
              date_of_birth: true,
              place_of_origin: true,
              email: true
            }
          },
          doctor: true
        }
      });

      if (!history) {
        return res.status(404).json({ error: "Historia clínica no encontrada" });
      }

      // Verificar permisos (solo el doctor asignado o admin)
      if (req.user.role !== "ADMIN" && history.doctor_id !== req.user.id) {
        return res.status(403).json({
          error: "No tienes permiso para firmar esta historia clínica"
        });
      }

      // Verificar si ya está firmada
      if (history.medical_signature) {
        return res.status(400).json({
          error: "Esta historia clínica ya ha sido firmada"
        });
      }

      // Actualizar con la firma
      const updatedHistory = await prisma.clinicalHistory.update({
        where: { id: Number(id) },
        data: {
          medical_signature: signature
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
          consultation: true
        }
      });

      await createAlert(
        `El doctor ${history.doctor.full_name} firmó la historia clínica del paciente ${history.patient.first_name} ${history.patient.last_name}`,
        "INFO"
      );

      res.json({
        message: "Historia clínica firmada exitosamente",
        data: updatedHistory
      });

    } catch (error) {
      console.error("Error al firmar historia clínica:", error);
      await createAlert(
        `Error al firmar historia clínica: ${error.message}`,
        "CRITICAL"
      );
      res.status(500).json({ error: "Error al firmar historia clínica" });
    }
  }
);

export default router;