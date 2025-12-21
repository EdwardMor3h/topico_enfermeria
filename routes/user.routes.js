import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import { uploadSignature } from "../middlewares/upload.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ SUBIR FIRMA DEL MÉDICO
 * SOLO DOCTOR
 */
router.post(
  "/upload-signature",
  verifyToken,
  checkRole("DOCTOR"),
  uploadSignature.single("signature"),
  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          error: "No se envió ninguna imagen. Usa el campo 'signature'",
        });
      }

      const filePath = `/signatures/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { signature: filePath },
      });

      res.json({
        message: "✅ Firma subida correctamente",
        signature: filePath,
        user,
      });

    } catch (error) {
      console.error("ERROR REAL SUBIENDO FIRMA:", error);
      res.status(500).json({ error: error.message }); // ✅ CLAVE
    }
  }
);


export default router;
