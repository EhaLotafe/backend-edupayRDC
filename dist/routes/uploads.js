"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = __importDefault(require("../prisma/client"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "uploads/" }); // dossier temporaire
router.post("/payment/:id/proof", authMiddleware_1.verifyTokenMiddleware, upload.single("file"), async (req, res) => {
    const user = req.user;
    if (user.role !== "parent")
        return res.status(403).json({ error: "Accès refusé" });
    const filePath = req.file?.path;
    if (!filePath)
        return res.status(400).json({ error: "Fichier manquant" });
    const payment = await client_1.default.payment.update({
        where: { id: req.params.id },
        data: { receiptData: { filePath } }
    });
    res.json({ message: "Preuve uploadée", payment });
});
exports.default = router;
