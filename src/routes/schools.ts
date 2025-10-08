import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { verifyTokenMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

/**
 * 🏫 Route: GET /api/schools/me
 * 🔒 Récupère les infos de l'école connectée (avec ses élèves)
 */
router.get("/me", verifyTokenMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== "school") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const school = await prisma.school.findUnique({
      where: { id: user.sub },
      include: { students: true },
    });

    if (!school) return res.status(404).json({ error: "École introuvable" });
    res.json(school);
  } catch (error) {
    console.error("Erreur GET /schools/me:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * 🔍 Route: GET /api/schools/search?q=...
 * 🔒 Recherche d’écoles (nom ou email)
 */
router.get("/search", verifyTokenMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    if (!q) {
      return res.status(400).json({ error: "Paramètre 'q' manquant" });
    }

    const schools = await prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 20, // limite les résultats pour éviter une surcharge
      orderBy: { name: "asc" },
    });

    res.json(schools);
  } catch (error) {
    console.error("Erreur GET /schools/search:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
