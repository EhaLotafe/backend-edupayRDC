"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Parent crée un paiement (ex: après transfert)
router.post("/", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const user = req.user;
    if (user.role !== "parent")
        return res.status(403).json({ error: "Accès refusé" });
    const { feeId, amount, currency, paymentMethod, transactionId } = req.body;
    const payment = await client_1.default.payment.create({
        data: { feeId, parentId: user.sub, amount: Number(amount), currency, paymentMethod, transactionId, status: "pending" }
    });
    res.json(payment);
});
// Récupérer tous les paiements d’un parent
router.get("/me", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const user = req.user;
    if (user.role !== "parent")
        return res.status(403).json({ error: "Accès refusé" });
    const payments = await client_1.default.payment.findMany({ where: { parentId: user.sub }, include: { fee: true } });
    res.json(payments);
});
// École valide ou refuse un paiement
router.put("/:id/status", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const user = req.user;
    if (user.role !== "school")
        return res.status(403).json({ error: "Accès refusé" });
    const { status } = req.body; // "completed", "failed"
    const payment = await client_1.default.payment.update({
        where: { id: req.params.id },
        data: { status }
    });
    res.json(payment);
});
exports.default = router;
