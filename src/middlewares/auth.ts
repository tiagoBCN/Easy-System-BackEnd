import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    res.status(401).json({ error: "Erro no formato do token" });
    return;
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: "Token mal formatado" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: "Segredo JWT não configurado no servidor" });
    return;
  }

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  });
}
