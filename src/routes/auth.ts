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
// Demander un OTP
router.post("/request-otp", async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone requis" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  let parent = await prisma.parent.upsert({
    where: { phone },
    update: { otp, otpExpiry, name },
    create: { phone, name, otp, otpExpiry },
  });

  console.log("OTP pour", phone, ":", otp); // remplacer par envoi SMS en prod
  res.json({ message: "OTP généré et envoyé" });
});

// Vérifier l'OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: "Phone + OTP requis" });

  const parent = await prisma.parent.findUnique({ where: { phone } });
  if (!parent) return res.status(404).json({ error: "Parent introuvable" });

  if (parent.otp !== otp) return res.status(400).json({ error: "OTP invalide" });
  if (parent.otpExpiry && parent.otpExpiry < new Date())
    return res.status(400).json({ error: "OTP expiré" });

  const token = signToken({ sub: parent.id, role: "parent" });

  await prisma.parent.update({
    where: { phone },
    data: { otp: null, otpExpiry: null, verified: true },
  });

  res.json({ token, parent });
});

export default router;
