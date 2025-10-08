"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
exports.PORT = process.env.PORT ? Number(process.env.PORT) : 8001;
exports.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
exports.JWT_SECRET = process.env.JWT_SECRET || "changeme";
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
