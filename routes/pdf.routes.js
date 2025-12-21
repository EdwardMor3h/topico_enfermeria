import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

/**
 * 🧾 GENERAR PDF DE HISTORIA CLÍNICA
 * /api/pdf/clinical-history/:id
 */
router.get("/clinical-history/:id", async (req, res) => {
  try {
    const historyId = Number(req.params.id);

    // Obtener datos completos
    const history = await prisma.clinicalHistory.findUnique({
      where: { id: historyId },
      include: {
        patient: true,
        doctor: true,
        consultation: true,
      },
    });

    if (!history) {
      return res.status(404).json({ error: "Historia clínica no encontrada" });
    }

    // Crear PDF
    const doc = new PDFDocument();
    const fileName = `historia_clinica_${history.id}.pdf`;
    const filePath = path.join("public", "pdfs", fileName);

    // Crear carpeta si no existe
    fs.mkdirSync("public/pdfs", { recursive: true });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text("HISTORIA CLÍNICA", { align: "center" });
    doc.moveDown();

    // Datos del paciente
    doc.fontSize(14).text(`Paciente: ${history.patient.first_name} ${history.patient.last_name}`);
    doc.text(`DNI: ${history.patient.dni}`);
    doc.text(`Edad: ${history.patient.age ?? "N/A"}`);
    doc.moveDown();

    // Datos médicos
    doc.text(`Diagnóstico: ${history.diagnosis ?? "N/A"}`);
    doc.text(`Presión arterial: ${history.blood_pressure ?? "N/A"}`);
    doc.text(`Frecuencia cardíaca: ${history.heart_rate ?? "N/A"}`);
    doc.text(`Temperatura: ${history.temperature ?? "N/A"}`);
    doc.moveDown();

    // Firma del doctor
    if (history.doctor.signature) {
      const signaturePath = path.join("public", history.doctor.signature);

      if (fs.existsSync(signaturePath)) {
        doc.text("Firma del médico:");
        doc.image(signaturePath, { width: 150 });
      } else {
        doc.text("⚠ No se encontró la imagen de la firma.");
      }
    } else {
      doc.text("⚠ El médico no tiene firma registrada.");
    }

    doc.end();

    stream.on("finish", () => {
      res.download(filePath);
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});

export default router;
