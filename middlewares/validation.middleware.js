// ✅ Validar que sea número entero positivo (ID)
export const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id) || Number(id) <= 0) {
    return res.status(400).json({ error: "ID inválido" });
  }

  next();
};

// ✅ Validar campos obligatorios
export const requireFields = (fields) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === "") {
        return res.status(400).json({
          error: `El campo '${field}' es obligatorio`,
        });
      }
    }
    next();
  };
};

// ✅ Validar fecha válida
export const validateDate = (field) => {
  return (req, res, next) => {
    const value = req.body[field];
    if (!value || isNaN(new Date(value))) {
      return res.status(400).json({
        error: `Fecha inválida en el campo '${field}'`,
      });
    }
    next();
  };
};

// ✅ Validar ENUM (status, role, payment, etc)
export const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        error: `Valor inválido en '${field}'. Permitidos: ${allowedValues.join(", ")}`,
      });
    }

    next();
  };
};

// ✅ Validar números positivos
export const validatePositiveNumber = (field) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (isNaN(value) || Number(value) < 0) {
      return res.status(400).json({
        error: `El campo '${field}' debe ser un número positivo`,
      });
    }

    next();
  };
};
