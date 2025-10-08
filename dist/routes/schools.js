"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
/**
 * 🏫 Route: GET /api/schools/me
 * 🔒 Récupère les infos de l'école connectée (avec ses élèves)
 */
router.get("/me", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== "school") {
            return res.status(403).json({ error: "Accès refusé" });
        }
        const school = await client_1.default.school.findUnique({
            where: { id: user.sub },
            include: { students: true },
        });
        if (!school)
            return res.status(404).json({ error: "École introuvable" });
        res.json(school);
    }
    catch (error) {
        console.error("Erreur GET /schools/me:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
/**
 * 🔍 Route: GET /api/schools/search?q=...
 * 🔒 Recherche d’écoles (nom ou email)
 */
router.get("/search", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) {
            return res.status(400).json({ error: "Paramètre 'q' manquant" });
        }
        const schools = await client_1.default.school.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { email: { contains: q } },
                ],
            },
            take: 20, // limite les résultats pour éviter une surcharge
            orderBy: { name: "asc" },
        });
        res.json(schools);
    }
    catch (error) {
        console.error("Erreur GET /schools/search:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
exports.default = router;
