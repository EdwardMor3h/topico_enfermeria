import { createAudit } from "../utils/audit.util.js";

export function auditAction(action, entity) {
  return async (req, res, next) => {
    res.on("finish", () => {
      // Solo registrar si la respuesta fue exitosa
      if (res.statusCode < 400) {
        createAudit(req, action, entity, Number(req.params.id) || null);
      }
    });
    next();
  };
}
