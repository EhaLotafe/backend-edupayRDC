"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Liste des enfants du parent
router.get("/children", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    try {
        const parentId = req.user.sub; // .sub, pas .id
        const children = await prisma.child.findMany({
            where: { parentId },
            include: { fees: true }
        });
        res.json(children);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur lors du chargement" });
    }
});
exports.default = router;
