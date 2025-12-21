import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createAlert } from "../utils/alert.util.js";  // ✅ AÑADIDO

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ====================================================
 * REGISTRO DE USUARIO
 * ====================================================
 */
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        role
      }
    });

    // 🔔 ALERTA
    await createAlert(`Nuevo usuario registrado: ${email} (rol: ${role})`, "INFO");

    res.json(user);

  } catch (error) {
    console.error(error);
    await createAlert(`Fallo al registrar usuario: ${error.message}`, "WARNING");
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

/**
 * ====================================================
 * LOGIN
 * ====================================================
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await createAlert(`Intento de login con email inexistente: ${email}`, "WARNING");
      return res.status(400).json({ msg: "Usuario no existe" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await createAlert(`Contraseña incorrecta para usuario: ${email}`, "WARNING");
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 🔔 ALERTA DE LOGIN EXITOSO
    await createAlert(`Login exitoso: ${email}`, "INFO");

    res.json({ token, user });

  } catch (error) {
    console.error(error);
    await createAlert(`Error interno en login: ${error.message}`, "CRITICAL");
    res.status(500).json({ error: "Error en autenticación" });
  }
});

export default router;
