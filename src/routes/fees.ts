import { Router } from "express";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

router.post("/create", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "school") return res.status(403).json({ error: "Accès refusé" });
  const { childId, feeType, amount, currency, dueDate, description } = req.body;
  const fee = await prisma.fee.create({ data: { childId, schoolId: user.sub, feeType, amount: Number(amount), currency, dueDate: new Date(dueDate), description } });
  res.json(fee);
});

router.get("/child/:id", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const fees = await prisma.fee.findMany({ where: { childId: req.params.id } });
  res.json(fees);
});

export default router;
