import { Router } from "express";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "parent") return res.status(403).json({ error: "Accès refusé" });
  const { name, classGrade, schoolId, schoolStudentId } = req.body;
  const child = await prisma.child.create({ data: { name, classGrade, schoolId, parentId: user.sub } });
  res.json(child);
});

export default router;
