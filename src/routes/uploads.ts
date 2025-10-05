import { Router } from "express";
import multer from "multer";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer({ dest: "uploads/" }); // dossier temporaire

router.post("/payment/:id/proof", verifyTokenMiddleware, upload.single("file"), async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "parent") return res.status(403).json({ error: "Accès refusé" });
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ error: "Fichier manquant" });

  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data: { receiptData: { filePath } }
  });

  res.json({ message: "Preuve uploadée", payment });
});

export default router;
