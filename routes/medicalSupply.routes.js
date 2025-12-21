import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ CREAR MEDICAMENTO
 * Solo ADMIN
 */
router.post("/", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const { name, description, stock, unit_price, expiration, supplier } = req.body;

    if (!name || stock === undefined || !unit_price) {
      return res.status(400).json({ 
        error: "Nombre, stock y precio son obligatorios" 
      });
    }

    const supply = await prisma.medicalSupply.create({
      data: {
        name,
        description,
        stock: Number(stock),
        unit_price: Number(unit_price),
        expiration: expiration ? new Date(expiration) : null,
        supplier,
      },
    });

    res.json(supply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear medicamento" });
  }
});

/**
 * ✅ LISTAR MEDICAMENTOS
 * Todos los usuarios autenticados
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const supplies = await prisma.medicalSupply.findMany({
      orderBy: { created_at: "desc" }
    });
    res.json(supplies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar medicamentos" });
  }
});

/**
 * ✅ OBTENER MEDICAMENTOS CON STOCK BAJO
 */
router.get("/low-stock", verifyToken, async (req, res) => {
  try {
    const supplies = await prisma.medicalSupply.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: "asc" }
    });

    res.json(supplies);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener stock bajo" });
  }
});

/**
 * ✅ OBTENER UN MEDICAMENTO POR ID
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const supply = await prisma.medicalSupply.findUnique({
      where: { id: Number(id) }
    });

    if (!supply) {
      return res.status(404).json({ error: "Medicamento no encontrado" });
    }

    res.json(supply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener medicamento" });
  }
});

/**
 * ✅ ACTUALIZAR MEDICAMENTO
 * Solo ADMIN
 */
router.put("/:id", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stock, unit_price, expiration, supplier } = req.body;

    const updateData = {
      name,
      description,
      stock: Number(stock),
      unit_price: Number(unit_price),
      supplier
    };

    if (expiration) {
      updateData.expiration = new Date(expiration);
    }

    const updated = await prisma.medicalSupply.update({
      where: { id: Number(id) },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar medicamento" });
  }
});

/**
 * ✅ ELIMINAR MEDICAMENTO
 * Solo ADMIN
 */
router.delete("/:id", verifyToken, checkRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene ventas asociadas
    const salesCount = await prisma.saleDetail.count({
      where: { medicalSupply_id: Number(id) }
    });

    if (salesCount > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar. Este medicamento tiene ventas asociadas." 
      });
    }

    await prisma.medicalSupply.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Medicamento eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar medicamento" });
  }
});

export default router;