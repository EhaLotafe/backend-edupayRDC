import jwt, { SignOptions, Secret } from "jsonwebtoken";
// Note: Assurez-vous d'avoir les variables d'environnement JWT_SECRET et JWT_EXPIRES_IN
// import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env"; 
// Je vais supposer ces imports pour la démonstration:
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Définit l'interface de payload que nous utilisons (id et role)
export interface TokenPayload {
    id: string;
    role: "admin" | "school" | "parent";
}

/**
 * Signe un nouveau token JWT.
 * @param payload Le contenu du token (ID de l'utilisateur et son rôle).
 * @returns Le token signé.
 */
export function signToken(payload: TokenPayload): string {
    const secret: Secret = JWT_SECRET;
    // La conversion `as` est nécessaire car `jwt.sign` accepte divers formats
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] }; 
    return jwt.sign(payload, secret, options);
}

/**
 * Vérifie et décode un token JWT.
 * @param token Le token à vérifier.
 * @returns Le payload décodé (TokenPayload).
 */
export function verifyToken(token: string): TokenPayload {
    // Le 'as any' initial permet de forcer le type, mais la signature utilise TokenPayload
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
