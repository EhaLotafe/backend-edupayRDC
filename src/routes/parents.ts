import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// Liste des enfants du parent
router.get("/children", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  try {
    const parentId = req.user.sub; // .sub, pas .id
    const children = await prisma.child.findMany({
      where: { parentId },
      include: { fees: true }
    });
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du chargement" });
  }
});


export default router;
