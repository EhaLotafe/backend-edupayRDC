"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenMiddleware = verifyTokenMiddleware;
const jwt_1 = require("../utils/jwt");
async function verifyTokenMiddleware(req, res, next) {
    const auth = req.headers["authorization"];
    if (!auth)
        return res.status(401).json({ error: "Token manquant" });
    const parts = auth.split(" ");
    if (parts.length !== 2)
        return res.status(401).json({ error: "Token invalide" });
    try {
        const decoded = (0, jwt_1.verifyToken)(parts[1]);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Token invalide ou expiré" });
    }
}
