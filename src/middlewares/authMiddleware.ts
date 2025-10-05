import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export async function verifyTokenMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth) return res.status(401).json({ error: "Token manquant" });

  const parts = auth.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "Token invalide" });

  try {
    const decoded = verifyToken(parts[1]);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
