import { Router } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyToken } from "../middlewares/auth.middleware.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * ✅ CREAR VENTA COMPLETA
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { patient_id, customer_name, customer_dni, payment, details } = req.body;

    console.log("📥 Datos recibidos:", JSON.stringify({ patient_id, customer_name, customer_dni, payment, details }, null, 2));

    // Validar que tenga al menos uno: paciente o nombre de cliente
    if (!patient_id && !customer_name) {
      return res.status(400).json({ 
        error: "Debe proporcionar un paciente registrado o el nombre del cliente" 
      });
    }

    // Validar que haya detalles
    if (!details || details.length === 0) {
      return res.status(400).json({ 
        error: "Debe agregar al menos un producto" 
      });
    }

    // Validar método de pago
    const validPayments = ['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER'];
    if (!payment) {
      return res.status(400).json({ 
        error: "El método de pago es requerido" 
      });
    }
    
    if (!validPayments.includes(payment)) {
      return res.status(400).json({ 
        error: `Método de pago inválido: "${payment}". Valores válidos: ${validPayments.join(', ')}` 
      });
    }

    console.log(`✅ Método de pago validado: ${payment}`);

    // Validar stock disponible
    for (let item of details) {
      const supply = await prisma.medicalSupply.findUnique({
        where: { id: Number(item.medicalSupply_id) }
      });

      if (!supply) {
        return res.status(400).json({ 
          error: `Producto con ID ${item.medicalSupply_id} no encontrado` 
        });
      }

      if (supply.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${supply.name}. Disponible: ${supply.stock}` 
        });
      }
    }

    console.log("✅ Stock validado");

    // Calcular total
    let total = 0;
    for (let item of details) {
      total += Number(item.quantity) * Number(item.unit_price);
    }

    console.log("💰 Total calculado:", total);

    // Preparar datos de la venta
    const saleData = {
      total: Number(total.toFixed(2)),
      payment: payment,
      details: {
        create: details.map(item => ({
          medicalSupply_id: Number(item.medicalSupply_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          subtotal: Number((item.quantity * item.unit_price).toFixed(2)),
        })),
      },
    };

    // Agregar paciente o datos de cliente
    if (patient_id) {
      saleData.patient_id = Number(patient_id);
      console.log(`👤 Venta para paciente ID: ${patient_id}`);
    } else {
      saleData.patient_id = null;
      saleData.customer_name = customer_name;
      saleData.customer_dni = customer_dni || null;
      console.log(`👤 Venta para cliente anónimo: ${customer_name}`);
    }

    console.log("📦 Datos de venta a crear:", JSON.stringify(saleData, null, 2));

    // Crear la venta
    const sale = await prisma.sale.create({
      data: saleData,
      include: {
        patient: true,
        details: {
          include: {
            medicalSupply: true,
          },
        },
      },
    });

    console.log("✅ Venta creada con ID:", sale.id);

    // Descontar stock
    for (let item of details) {
      await prisma.medicalSupply.update({
        where: { id: Number(item.medicalSupply_id) },
        data: {
          stock: {
            decrement: Number(item.quantity),
          },
        },
      });
      console.log(`📉 Stock actualizado para producto ID ${item.medicalSupply_id}`);
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error("❌❌❌ ERROR COMPLETO ❌❌❌");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje:", error.message);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Código de error Prisma:", error.code);
      console.error("Meta:", error.meta);
    }
    
    console.error("Stack completo:", error.stack);
    
    res.status(500).json({ 
      error: "Error al registrar venta",
      details: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
});

/**
 * ✅ ESTADÍSTICAS DE VENTAS
 */
router.get("/stats/summary", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [totalSales, todaySales, totalRevenue, todayRevenue] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.count({
        where: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.sale.aggregate({
        _sum: { total: true }
      }),
      prisma.sale.aggregate({
        _sum: { total: true },
        where: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    ]);

    res.json({
      totalSales,
      todaySales,
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

/**
 * ✅ LISTAR VENTAS
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        patient: true,
        details: {
          include: {
            medicalSupply: true,
          },
        },
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.json(sales);
  } catch (error) {
    console.error("❌ Error al listar ventas:", error);
    res.status(500).json({ error: "Error al listar ventas" });
  }
});

/**
 * ✅ OBTENER VENTA POR ID
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        patient: true,
        details: {
          include: {
            medicalSupply: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(sale);
  } catch (error) {
    console.error("❌ Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
});

export default router;
