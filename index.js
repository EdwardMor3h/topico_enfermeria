import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import clinicalHistoryRoutes from "./routes/clinicalHistory.routes.js";
import medicalSupplyRoutes from "./routes/medicalSupply.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import procedureRoutes from "./routes/procedure.routes.js";
import procedureRecordRoutes from "./routes/procedureRecord.routes.js";
import userRoutes from "./routes/user.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import doctorRoutes from './routes/doctor.routes.js';


const app = express();

// ✅ Middlewares globales
app.use(cors());
app.use(express.json());

// ✅ Servir firmas de médicos correctamente
app.use(
  "/signatures",
  express.static(path.join(process.cwd(), "public/signatures"))
);

// ✅ Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/clinical-history", clinicalHistoryRoutes);
app.use("/api/medical-supplies", medicalSupplyRoutes);  // ✅ CAMBIADO: Con guión
app.use("/api/sales", saleRoutes);
app.use("/api/procedures", procedureRoutes);
app.use("/api/procedure-records", procedureRecordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/doctor", doctorRoutes);

// ✅ Servidor
app.listen(3000, () => {
  console.log("✅ Servidor corriendo en http://localhost:3000");
});