// ========================================
// 📁 routes/pdf.routes.js - COMPLETO Y CORREGIDO
// ========================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

/**
 * 🧾 GENERAR PDF DE HISTORIA CLÍNICA - FORMATO EMPRESA
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
        consultation: {
          include: {
            patient: true
          }
        }
      },
    });

    if (!history) {
      return res.status(404).json({ error: "Historia clínica no encontrada" });
    }

    // Verificar que esté firmada
    if (!history.medical_signature) {
      return res.status(400).json({
        error: "La historia clínica debe estar firmada para generar el PDF"
      });
    }

    // Crear PDF en tamaño A4
    const doc = new PDFDocument({ 
      margin: 40, 
      size: 'A4',
      bufferPages: true,
      autoFirstPage: false // ⬅️ Evita páginas en blanco
    });
    
    const fileName = `HC_${history.patient.dni}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    // Agregar la primera página manualmente
    doc.addPage();

    // ==================== ENCABEZADO CON FONDO CELESTE ====================
    const pageWidth = doc.page.width - 80;
    
    // Franja celeste superior
    doc.rect(0, 0, doc.page.width, 120).fill('#4A90E2');
    
    // Logo en el lado izquierdo
    const logoBase64 = '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';
    
    try {
      const logoBuffer = Buffer.from(logoBase64, 'base64');
      doc.image(logoBuffer, 40, 25, { width: 70, height: 70 });
    } catch (err) {
      console.log('Error al cargar logo:', err);
    }
    
    // Datos de la empresa (a la derecha del logo)
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('Tópico de Enfermería M&R S.A.C', 130, 30, { align: 'right' });
    
    doc.fontSize(9).font('Helvetica')
       .fillColor('#FFFFFF')
       .text('Calle: Francisco Gonzales Burga N°497', 130, 52, { align: 'right' })
       .text('Pueblo Nuevo-Ferreñafe', 130, 67, { align: 'right' })
       .text('Celular: 916423945', 130, 82, { align: 'right' });
    
    // Título "HISTORIA CLÍNICA" con fondo blanco
    doc.rect(40, 130, 515, 50).fill('#FFFFFF');
    doc.fontSize(22).font('Helvetica-Bold')
       .fillColor('#4A90E2')
       .text('HISTORIA CLÍNICA', 40, 145, { align: 'center', width: 515 });

    // ==================== INFORMACIÓN DEL PACIENTE ====================
    let yPos = 200;
    
    // Caja con fondo celeste claro
    doc.rect(40, yPos, 515, 35).fill('#E3F2FD');
    
    // Título "INFORMACIÓN DEL PACIENTE"
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#4A90E2')
       .text('INFORMACIÓN DEL PACIENTE', 50, yPos + 10);
    
    // Número de H.C. a la derecha
    doc.fontSize(10).font('Helvetica')
       .fillColor('#000000')
       .text(`Número de H.C: ${history.id}`, 370, yPos + 10);
    
    yPos += 45;
    
    // Datos del paciente
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Nombre y Apellidos: ', 45, yPos, { continued: true })
       .font('Helvetica')
       .text(`${history.patient.first_name} ${history.patient.last_name}`, { continued: true })
       .font('Helvetica-Bold')
       .text('  DNI: ', { continued: true })
       .font('Helvetica')
       .text(history.patient.dni);
    
    yPos += 20;
    
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Fecha de Nacimiento: ', 45, yPos, { continued: true })
       .font('Helvetica')
       .text(history.patient.date_of_birth ? new Date(history.patient.date_of_birth).toLocaleDateString('es-PE') : '___________________', { continued: true })
       .font('Helvetica-Bold')
       .text('  Lugar de Procedencia: ', { continued: true })
       .font('Helvetica')
       .text(history.patient.place_of_origin || '___________________');
    
    yPos += 20;
    
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Dirección: ', 45, yPos, { continued: true })
       .font('Helvetica')
       .text(history.patient.address || '___________________________________________________________________________________');
    
    yPos += 20;
    
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Teléfono: ', 45, yPos, { continued: true })
       .font('Helvetica')
       .text(history.patient.phone || '___________________', { continued: true })
       .font('Helvetica-Bold')
       .text('  Correo Electrónico: ', { continued: true })
       .font('Helvetica')
       .text(history.patient.email || '___________________');
    
    yPos += 25;

    // ==================== ANAMNESIS (SIGNOS VITALES) ====================
    // Caja con fondo celeste claro
    doc.rect(40, yPos, 515, 25).fill('#E3F2FD');
    
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#4A90E2')
       .text('ANAMNESIS', 50, yPos + 6);
    
    yPos += 35;
    
    // Primera línea de signos vitales
    const col1X = 45;
    const col2X = 180;
    const col3X = 315;
    const col4X = 450;
    
    doc.fontSize(9).font('Helvetica-Bold')
       .text('Edad:', col1X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.patient.age || 'N/A'}`, { continued: false });
    
    doc.font('Helvetica-Bold')
       .text('PA:', col2X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.blood_pressure || 'N/A'}`);
    
    doc.font('Helvetica-Bold')
       .text('FC:', col3X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.heart_rate || 'N/A'}`);
    
    doc.font('Helvetica-Bold')
       .text('FR:', col4X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.respiratory_rate || 'N/A'}`);
    
    yPos += 15;
    
    // Segunda línea de signos vitales
    doc.font('Helvetica-Bold')
       .text('Talla:', col1X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.height || '_______'}`); // ⬅️ Talla viene de ClinicalHistory (signos vitales)
    
    doc.font('Helvetica-Bold')
       .text('T°:', col2X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.temperature || 'N/A'}°C`);
    
    doc.font('Helvetica-Bold')
       .text('Peso:', col3X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.weight || 'N/A'} kg`);
    
    doc.font('Helvetica-Bold')
       .text('SO2:', col4X, yPos, { continued: true })
       .font('Helvetica')
       .text(` ${history.oxygen_saturation || 'N/A'}%`);
    
    yPos += 20;
    
    doc.fontSize(8).font('Helvetica')
       .text(`Fecha: ${new Date(history.created_at).toLocaleDateString('es-PE')}`, 450, yPos);
    
    yPos += 25;

    // ==================== DIAGNÓSTICO ====================
    // Caja con fondo celeste claro
    doc.rect(40, yPos, 515, 25).fill('#E3F2FD');
    
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#4A90E2')
       .text('DIAGNÓSTICO:', 50, yPos + 6);
    
    yPos += 35;
    
    doc.fontSize(10).font('Helvetica')
       .fillColor('#000000')
       .text(history.diagnosis || 'No especificado', 45, yPos, { 
         width: 500, 
         align: 'justify' 
       });
    
    yPos = doc.y + 20;
    
    // ==================== TRATAMIENTO ====================
    // Caja con fondo celeste claro
    doc.rect(40, yPos, 515, 25).fill('#E3F2FD');
    
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#4A90E2')
       .text('TRATAMIENTO:', 50, yPos + 6);
    
    yPos += 35;
    
    doc.fontSize(10).font('Helvetica')
       .fillColor('#000000')
       .text(history.consultation.treatment || 'No especificado', 45, yPos, { 
         width: 500, 
         align: 'justify' 
       });
    
    yPos = doc.y + 20;
    
    // ==================== OBSERVACIONES ====================
    if (history.consultation.observations) {
      // Caja con fondo celeste claro
      doc.rect(40, yPos, 515, 25).fill('#E3F2FD');
      
      doc.fontSize(12).font('Helvetica-Bold')
         .fillColor('#4A90E2')
         .text('OBSERVACIONES:', 50, yPos + 6);
      
      yPos += 35;
      
      doc.fontSize(10).font('Helvetica')
         .fillColor('#000000')
         .text(history.consultation.observations, 45, yPos, { 
           width: 500, 
           align: 'justify' 
         });
      
      yPos = doc.y + 20;
    }
    
    yPos += 10;

    // ==================== FIRMA ====================
    // Asegurar espacio suficiente para la firma
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }
    
    yPos += 40;
    
    if (history.medical_signature) {
      try {
        const signatureBuffer = Buffer.from(
          history.medical_signature.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        );
        doc.image(signatureBuffer, 350, yPos, { width: 150, height: 60 });
      } catch (error) {
        console.error('Error al insertar firma:', error);
      }
    }
    
    yPos += 70;
    doc.moveTo(350, yPos).lineTo(500, yPos).stroke();
    yPos += 5;
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#000000')
       .text(`Dr(a). ${history.doctor.full_name}`, 350, yPos, { width: 150, align: 'center' });
    
    yPos += 15;
    doc.fontSize(8).font('Helvetica')
       .text(`Fecha: ${new Date(history.created_at).toLocaleDateString('es-PE')}`, 350, yPos, { width: 150, align: 'center' });

    // ==================== PIE DE PÁGINA CON FONDO CELESTE ====================
    // Obtener el número total de páginas
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      const footerY = doc.page.height - 40;
      
      // Franja celeste inferior
      doc.rect(0, footerY, doc.page.width, 40).fill('#4A90E2');
      
      doc.fontSize(9).font('Helvetica')
         .fillColor('#FFFFFF')
         .text('Correo: topicodeenfermeriamr@gmail.com', 40, footerY + 15, { align: 'left' });
    }

    doc.end();

  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});

/**
 * 🧾 GENERAR RECETA MÉDICA PARA EL PACIENTE
 * /api/pdf/prescription/:consultationId
 */
router.get("/prescription/:consultationId", async (req, res) => {
  try {
    const consultationId = Number(req.params.consultationId);

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!consultation) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    // Crear PDF tamaño Carta (más común para recetas)
    const doc = new PDFDocument({ 
      margin: 30,
      size: [612, 792], // Tamaño carta en puntos (8.5" x 11")
      bufferPages: true,
      autoFirstPage: false
    });
    
    const fileName = `Receta_${consultation.patient.dni}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    doc.addPage();

    // ==================== LOGO SUPERIOR ====================
    // Base64 del logo M&R (el mismo de la imagen)
    const logoBase64 = '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';
    
    try {
      const logoBuffer = Buffer.from(logoBase64, 'base64');
      doc.image(logoBuffer, 50, 30, { width: 70, height: 70 });
    } catch (err) {
      console.log('Logo no disponible');
    }

    // ==================== MARCA DE AGUA EN EL CENTRO ====================
    // Marca de agua gigante y transparente en el centro
    doc.save();
    doc.opacity(0.05); // Muy transparente
    try {
      const watermarkBuffer = Buffer.from(logoBase64, 'base64');
      doc.image(watermarkBuffer, 
        (doc.page.width - 300) / 2, 
        (doc.page.height - 300) / 2, 
        { width: 300, height: 300 }
      );
    } catch (err) {
      console.log('Marca de agua no disponible');
    }
    doc.restore();

    // ==================== ENCABEZADO DERECHO ====================
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000')
       .text('Tópico de Enfermería M&R S.A.C', 140, 35, { align: 'left', width: 400 });
    
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('Atención de 07:30 am a 7.30 pm de Lunes a Sábado', 140, 55, { align: 'left' });

    // ==================== CUADRO DATOS DEL PACIENTE ====================
    let yPos = 120;
    
    // Borde del cuadro principal
    doc.rect(50, yPos, 510, 100).stroke('#000000');
    
    // Campos del paciente
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
       .text('Nombre:', 60, yPos + 15)
       .text('_____________________________________________________________', 110, yPos + 15);
    
    // Llenar con datos reales
    doc.font('Helvetica')
       .text(`${consultation.patient.first_name} ${consultation.patient.last_name}`, 110, yPos + 15);
    
    doc.font('Helvetica-Bold')
       .text('Sexo:', 60, yPos + 40)
       .text('__________________________', 95, yPos + 40);
    
    // Determinar sexo (asumiendo que lo tienes en el modelo)
    const sexo = consultation.patient.gender || '_________';
    doc.font('Helvetica')
       .text(sexo, 95, yPos + 40);
    
    doc.font('Helvetica-Bold')
       .text('Edad:', 60, yPos + 65)
       .text('__________________________', 95, yPos + 65);
    
    doc.font('Helvetica')
       .text(`${consultation.patient.age || '___'} años`, 95, yPos + 65);

    // ==================== SÍMBOLO Rp. ====================
    yPos += 120;
    doc.fontSize(26).font('Helvetica-BoldOblique').fillColor('#000000')
       .text('Rp.', 50, yPos);

    // ==================== LÍNEAS PARA ESCRIBIR LA RECETA ====================
    yPos += 40;
    
    // Escribir el tratamiento en las líneas
    const lines = 12; // Número de líneas
    const lineSpacing = 25;
    
    // Si hay tratamiento, dividirlo en líneas
    const treatment = consultation.treatment || '';
    const treatmentLines = doc.widthOfString(treatment) > 450 
      ? treatment.match(/.{1,80}/g) || [treatment]
      : [treatment];
    
    for (let i = 0; i < lines; i++) {
      // Dibujar la línea
      doc.strokeColor('#000000').lineWidth(0.5)
         .moveTo(50, yPos).lineTo(560, yPos).stroke();
      
      // Escribir el tratamiento si hay
      if (i < treatmentLines.length) {
        doc.fontSize(10).font('Helvetica').fillColor('#000000')
           .text(treatmentLines[i], 55, yPos - 15, { width: 500 });
      }
      
      yPos += lineSpacing;
    }

    // ==================== CAMPOS INFERIORES ====================
    yPos += 20;
    
    // Fecha de atención con línea
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#000000')
       .text('Fecha de Atención', 80, yPos, { align: 'center', width: 150 });
    
    doc.strokeColor('#000000').lineWidth(1)
       .moveTo(80, yPos + 15).lineTo(230, yPos + 15).stroke();
    
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text(new Date(consultation.created_at).toLocaleDateString('es-PE'), 80, yPos + 18, { align: 'center', width: 150 });

    // Sello/Firma/Col con línea
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#000000')
       .text('Sello/Firma/Col.', 380, yPos, { align: 'center', width: 150 });
    
    doc.strokeColor('#000000').lineWidth(1)
       .moveTo(380, yPos + 15).lineTo(530, yPos + 15).stroke();
    
    // Firma del doctor (si existe)
    if (consultation.doctor.signature) {
      try {
        const signatureBuffer = Buffer.from(
          consultation.doctor.signature.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        );
        doc.image(signatureBuffer, 400, yPos - 30, { width: 100, height: 40 });
      } catch (err) {
        console.log('Firma no disponible');
      }
    }
    
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text(`Dr(a). ${consultation.doctor.full_name}`, 380, yPos + 18, { align: 'center', width: 150 });

    // ==================== PIE DE PÁGINA ====================
    const footerY = doc.page.height - 80;
    
    // Dirección
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('Calle Francisco Gonzales Burga N° 497 - Pueblo Nuevo-Ferreñafe', 50, footerY, { align: 'center', width: 512 });
    
    // Email
    doc.fontSize(9).fillColor('#000000')
       .text('topicodeenfermeriamr@gmail.com', 50, footerY + 20, { align: 'center', width: 512 });
    
    // Teléfono con ícono de WhatsApp
    doc.fontSize(9).fillColor('#000000')
       .text('916423945', 50, footerY + 40, { align: 'center', width: 512 });

    // ==================== TRIÁNGULOS DECORATIVOS ====================
    // Triángulo superior derecho (azul oscuro)
    doc.save();
    doc.polygon([doc.page.width, 0], [doc.page.width, 100], [doc.page.width - 100, 0])
       .fill('#2C3E50');
    doc.restore();
    
    // Triángulo inferior izquierdo (verde)
    doc.save();
    doc.polygon([0, doc.page.height], [100, doc.page.height], [0, doc.page.height - 100])
       .fill('#27AE60');
    doc.restore();

    // Finalizar
    doc.end();

  } catch (error) {
    console.error("Error al generar receta:", error);
    res.status(500).json({ error: "Error al generar receta" });
  }
});

export default router;