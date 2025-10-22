import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
// Utilisation de l'importation ES Module pour jwt
import * as jsonwebtoken from "jsonwebtoken"; 

// Interface étendue pour inclure les données utilisateur décodées
// Utiliser 'Request' au lieu de 'Request<...>' aide à la compatibilité
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'school' | 'parent'; // Ajoutez tous les rôles possibles
  };
}

// NOTE: Le middleware original 'verifyTokenMiddleware' n'est pas utilisé dans les routes admin.ts
// Je l'ai laissé mais il n'est pas exporté pour éviter les confusions.
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

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/**
 * Fonction de protection des routes (anciennement authMiddleware)
 * Vérifie le token JWT et le rôle si des rôles sont spécifiés.
 * Utilisée dans admin.ts comme 'protect'.
 */
export const protect = 
  (allowedRoles: string[] = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Token manquant" });

    const token = header.split(" ")[1];
    try {
      // Utilisation de jsonwebtoken.verify
      const decoded = jsonwebtoken.verify(token, JWT_SECRET) as AuthRequest['user'];
      
      // Vérification des rôles
      if (allowedRoles.length && (!decoded || !allowedRoles.includes(decoded.role))) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      // Attacher l'utilisateur à la requête
      (req as AuthRequest).user = decoded; 
      next();
    } catch (err) {
      res.status(401).json({ message: "Token invalide" });
    }
  };
