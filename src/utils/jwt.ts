import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env";

export function signToken(payload: string | object) {
  const secret: Secret = JWT_SECRET;
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as any;
}
