"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/create", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const user = req.user;
    if (user.role !== "school")
        return res.status(403).json({ error: "Accès refusé" });
    const { childId, feeType, amount, currency, dueDate, description } = req.body;
    const fee = await client_1.default.fee.create({ data: { childId, schoolId: user.sub, feeType, amount: Number(amount), currency, dueDate: new Date(dueDate), description } });
    res.json(fee);
});
router.get("/child/:id", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const fees = await client_1.default.fee.findMany({ where: { childId: req.params.id } });
    res.json(fees);
});
exports.default = router;
