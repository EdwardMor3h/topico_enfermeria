import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/* ============================================================
   📌 DASHBOARD DEL DOCTOR
   ============================================================ */

// 1. Estadísticas del Doctor
router.get("/stats", verifyToken, checkRole("DOCTOR"), async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const [todayAppointments, todayConsultations, pendingAppointments, totalPatients] = 
      await Promise.all([
        // Citas de hoy del doctor
        prisma.appointment.count({
          where: {
            date: { gte: start, lte: end },
            // Filtrar solo las citas donde el doctor está asignado
            // Nota: Necesitarías agregar doctor_id en Appointment si quieres filtrar por doctor
          }
        }),

        // Consultas realizadas hoy
        prisma.consultation.count({
          where: {
            doctor_id: doctorId,
            created_at: { gte: start, lte: end }
          }
        }),

        // Citas pendientes (programadas pero no atendidas)
        prisma.appointment.count({
          where: {
            status: "SCHEDULED",
            date: { gte: start }
          }
        }),

        // Total de pacientes únicos atendidos por el doctor
        prisma.consultation.findMany({
          where: { doctor_id: doctorId },
          select: { patient_id: true },
          distinct: ['patient_id']
        }).then(patients => patients.length)
      ]);

    return res.json({
      todayAppointments,
      todayConsultations,
      pendingAppointments,
      totalPatients
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo estadísticas del doctor" });
  }
});


// 2. Citas del día para el doctor
router.get("/appointments/today", verifyToken, checkRole("DOCTOR"), async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end }
      },
      include: {
        patient: {
          select: {
            id: true,
            dni: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { date: "asc" }
    });

    res.json(appointments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo citas del día" });
  }
});


// 3. Consultas recientes del doctor
router.get("/consultations/recent", verifyToken, checkRole("DOCTOR"), async (req, res) => {
  try {
    const doctorId = req.user.id;

    const consultations = await prisma.consultation.findMany({
      where: { doctor_id: doctorId },
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.json(consultations);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo consultas recientes" });
  }
});


// 4. Mis pacientes (lista de pacientes atendidos por el doctor)
router.get("/patients", verifyToken, checkRole("DOCTOR"), async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Obtener pacientes únicos que ha atendido este doctor
    const consultations = await prisma.consultation.findMany({
      where: { doctor_id: doctorId },
      select: { patient_id: true },
      distinct: ['patient_id']
    });

    const patientIds = consultations.map(c => c.patient_id);

    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds }
      },
      orderBy: { last_name: "asc" }
    });

    res.json(patients);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo pacientes" });
  }
});


export default router;