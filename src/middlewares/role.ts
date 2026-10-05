import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

/**
 * Middleware que restringe o acesso a uma rota apenas para roles específicas.
 * Deve ser usado APÓS o authMiddleware.
 *
 * Exemplo: router.get("/admin", authMiddleware, roleMiddleware("owner"), handler)
 */
export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Acesso negado. Permissão insuficiente." });
      return;
    }

    next();
  };
}
