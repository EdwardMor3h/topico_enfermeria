import jwt from "jsonwebtoken";

// ✅ Verificar token
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token no enviado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🟢 TOKEN DECODIFICADO:", decoded); // 👈 CLAVE

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}



// ✅ Verificar rol (ADMIN, DOCTOR, NURSE)
export function checkRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user.role?.toUpperCase();

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Acceso denegado por rol" });
    }

    next();
  };
}

