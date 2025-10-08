import { Router } from "express";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

// Parent crée un paiement (ex: après transfert)
router.post("/", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "parent") return res.status(403).json({ error: "Accès refusé" });
  const { feeId, amount, currency, paymentMethod, transactionId } = req.body;
  const payment = await prisma.payment.create({
    data: { feeId, parentId: user.sub, amount: Number(amount), currency, paymentMethod, status: "pending" }
  });
  res.json(payment);
});

// Récupérer tous les paiements d’un parent
router.get("/me", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "parent") return res.status(403).json({ error: "Accès refusé" });
  const payments = await prisma.payment.findMany({ where: { parentId: user.sub }, include: { fee: true } });
  res.json(payments);
});

// École valide ou refuse un paiement
router.put("/:id/status", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "school") return res.status(403).json({ error: "Accès refusé" });
  const { status } = req.body; // "completed", "failed"
  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(payment);
});

export default router;
