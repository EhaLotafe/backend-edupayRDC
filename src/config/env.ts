import dotenv from "dotenv";
import path from "path";


dotenv.config({ path: path.resolve(process.cwd(), ".env") });


export const PORT = process.env.PORT ? Number(process.env.PORT) : 8001;
export const DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
export const JWT_SECRET = process.env.JWT_SECRET || "changeme";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";