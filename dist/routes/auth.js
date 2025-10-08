"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
// Register school (basic)
router.post("/register-school", async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "email + password requis" });
    const existing = await client_1.default.school.findUnique({ where: { email } });
    if (existing)
        return res.status(400).json({ error: "Email déjà utilisé" });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const school = await client_1.default.school.create({ data: { name, email, password: hashed } });
    res.json({ school });
});
// School login
router.post("/login-school", async (req, res) => {
    const { email, password } = req.body;
    const school = await client_1.default.school.findUnique({ where: { email } });
    if (!school)
        return res.status(400).json({ error: "École introuvable" });
    const ok = await bcryptjs_1.default.compare(password, school.password);
    if (!ok)
        return res.status(401).json({ error: "Mot de passe incorrect" });
    const token = (0, jwt_1.signToken)({ sub: school.id, role: "school" });
    res.json({ token, school });
});
// Simpler parent auth (phone only - create or return parent)
router.post("/login-parent", async (req, res) => {
    const { phone, name } = req.body;
    if (!phone)
        return res.status(400).json({ error: "phone requis" });
    let parent = await client_1.default.parent.findUnique({ where: { phone } });
    if (!parent) {
        parent = await client_1.default.parent.create({ data: { phone, name } });
    }
    const token = (0, jwt_1.signToken)({ sub: parent.id, role: "parent" });
    res.json({ token, parent });
});
exports.default = router;
