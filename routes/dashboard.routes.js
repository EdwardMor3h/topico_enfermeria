import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/* ============================================================
   📌 1. KPI – MÉTRICAS RÁPIDAS PARA EL DASHBOARD
   ============================================================ */
router.get(
  "/stats",
  verifyToken,
  checkRole("ADMIN", "NURSE"),
  async (req, res) => {
    try {
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));

      const [
        totalPatients,
        todayAppointments,
        todayConsultations,
        todaySales,
        todayProcedures,
        criticalAlerts,
        lowStock
      ] = await Promise.all([

        prisma.patient.count(),

        prisma.appointment.count({
          where: { date: { gte: start, lte: end } }
        }),

        prisma.consultation.count({
          where: { created_at: { gte: start, lte: end } }
        }),

        prisma.sale.aggregate({
          _sum: { total: true },
          where: { created_at: { gte: start, lte: end } }
        }),

        prisma.procedureRecord.count({
          where: { date: { gte: start, lte: end } }
        }),

        prisma.alert.count({
          where: { level: "CRITICAL" }
        }),

        prisma.medicalSupply.count({
          where: { stock: { lt: 5 } }
        })

      ]);

      return res.json({
        totalPatients,
        todayAppointments,
        todayConsultations,
        todaySales: todaySales._sum.total || 0,
        todayProcedures,
        criticalAlerts,
        lowStock
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error obteniendo estadísticas" });
    }
  }
);


/* ============================================================
   📌 2. Gráfico – Citas del mes (barras)
   ============================================================ */
router.get("/appointments/month", verifyToken, async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT DATE(date) AS day, COUNT(*) AS total
      FROM "Appointment"
      WHERE date >= date_trunc('month', CURRENT_DATE)
      GROUP BY day
      ORDER BY day;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo citas mensuales" });
  }
});


/* ============================================================
   📌 3. Gráfico – Consultas por doctor
   ============================================================ */
router.get("/consultations/by-doctor", verifyToken, async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT u.full_name, COUNT(*) AS total
      FROM "Consultation" c
      JOIN "User" u ON u.id = c.doctor_id
      GROUP BY u.full_name;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo consultas por doctor" });
  }
});


/* ============================================================
   📌 4. Gráfico – Ventas del mes
   ============================================================ */
router.get("/sales/month", verifyToken, async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT DATE(created_at) AS day, SUM(total) AS amount
      FROM "Sale"
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY day
      ORDER BY day;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo ventas del mes" });
  }
});


/* ============================================================
   📌 5. Medicamentos más vendidos
   ============================================================ */
router.get("/supplies/top", verifyToken, async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT ms.name, SUM(sd.quantity) AS total
      FROM "SaleDetail" sd
      JOIN "MedicalSupply" ms ON ms.id = sd.medicalSupply_id
      GROUP BY ms.name
      ORDER BY total DESC
      LIMIT 5;
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo top de medicamentos" });
  }
});


/* ============================================================
   📌 6. Medicamentos con stock bajo
   ============================================================ */
router.get("/supplies/low-stock", verifyToken, async (req, res) => {
  try {
    const supplies = await prisma.medicalSupply.findMany({
      where: { stock: { lt: 5 } },
      orderBy: { stock: "asc" }
    });

    res.json(supplies);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo stock bajo" });
  }
});


/* ============================================================
   📌 7. Últimas 10 auditorías del sistema
   ============================================================ */
router.get("/audit/latest", verifyToken, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: { user: true }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo auditorías" });
  }
});


/* ============================================================
   📌 8. Últimas 10 consultas
   ============================================================ */
router.get("/consultations/latest", verifyToken, async (req, res) => {
  try {
    const consultations = await prisma.consultation.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo últimas consultas" });
  }
});


export default router;
