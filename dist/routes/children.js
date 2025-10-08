"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.verifyTokenMiddleware, async (req, res) => {
    const user = req.user;
    if (user.role !== "parent")
        return res.status(403).json({ error: "Accès refusé" });
    const { name, classGrade, schoolId, schoolStudentId } = req.body;
    const child = await client_1.default.child.create({ data: { name, classGrade, schoolId, parentId: user.sub } });
    res.json(child);
});
exports.default = router;
