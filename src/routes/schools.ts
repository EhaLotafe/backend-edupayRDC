import { Router } from "express";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const user = req.user;
  if (user.role !== "school") return res.status(403).json({ error: "Accès refusé" });
  const school = await prisma.school.findUnique({ where: { id: user.sub }, include: { students: true } });
  res.json(school);
});
router.get("/search", verifyTokenMiddleware, async (req: AuthRequest, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") return res.status(400).json({ error: "Query manquante" });

  const schools = await prisma.school.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ]
    }
  });
  res.json(schools);
});

export default router;
