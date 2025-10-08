"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signToken(payload) {
    const secret = env_1.JWT_SECRET;
    const options = { expiresIn: env_1.JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
}
