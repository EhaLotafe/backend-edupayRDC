import { Router } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt";

const router = Router();

// Register school (basic)
router.post("/register-school", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email + password requis" });

  const existing = await prisma.school.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email déjà utilisé" });

  const hashed = await bcrypt.hash(password, 10);
  const school = await prisma.school.create({ data: { name, email, password: hashed } });
  res.json({ school });
});

// School login
router.post("/login-school", async (req, res) => {
  const { email, password } = req.body;
  const school = await prisma.school.findUnique({ where: { email } });
  if (!school) return res.status(400).json({ error: "École introuvable" });
  const ok = await bcrypt.compare(password, school.password);
  if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });
  const token = signToken({ sub: school.id, role: "school" });
  res.json({ token, school });
});

// Simpler parent auth (phone only - create or return parent)
router.post("/login-parent", async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: "phone requis" });
  let parent = await prisma.parent.findUnique({ where: { phone } });
  if (!parent) {
    parent = await prisma.parent.create({ data: { phone, name } });
  }
  const token = signToken({ sub: parent.id, role: "parent" });
  res.json({ token, parent });
});

export default router;
