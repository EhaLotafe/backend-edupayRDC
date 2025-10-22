import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
// Correction: Importation de 'protect' et 'AuthRequest'
import { protect, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

/**
 * 🏫 Route: GET /api/schools/me
 * 🔒 Récupère les infos de l'école connectée (avec ses élèves et les frais)
 */
// Correction: Utilisation de protect(['school'])
router.get("/me", protect(["school"]), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    // Le middleware 'protect' assure que req.user est défini et a le rôle 'school'
    if (!user) {
      return res.status(401).json({ error: "Non authentifié." });
    }

    const school = await prisma.school.findUnique({
      // Correction: Utilisation de user.id au lieu de user.sub
      where: { id: user.id }, 
      include: { 
        students: {
          include: { 
            fees: {
              where: { status: { not: 'paid' } }, // N'affiche que les frais non payés
              orderBy: { dueDate: 'asc' }
            } 
          } 
        },
      },
    });

    if (!school) {
        return res.status(404).json({ error: "École introuvable" });
    }
    
    // Pour des raisons de sécurité, nous retirons le mot de passe avant l'envoi
    const { password, ...schoolInfo } = school; 

    res.json(schoolInfo);

  } catch (error) {
    console.error("Erreur GET /schools/me:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des données de l'école." });
  }
});

/**
 * 🔍 Route: GET /api/schools/search?q=...
 * 🔒 Recherche d’écoles (nom ou email) - Accessible par les parents pour lier un enfant
 */
// Correction: Utilisation de protect(['parent']) pour la recherche
router.get("/search", protect(["parent"]), async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    if (!q || q.length < 3) {
      return res.status(400).json({ error: "Veuillez entrer au moins 3 caractères pour la recherche." });
    }

    // Ajout d'une vérification pour ne retourner que les écoles approuvées
    const schools = await prisma.school.findMany({
      where: {
        isApproved: true, // Seules les écoles approuvées sont recherchables
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { // Limite les champs retournés pour la sécurité et la performance
        id: true,
        name: true,
        email: true,
      },
      take: 20, 
      orderBy: { name: "asc" },
    });

    res.json(schools);
  } catch (error) {
    console.error("Erreur GET /schools/search:", error);
    res.status(500).json({ error: "Erreur serveur lors de la recherche d'écoles." });
  }
});

export default router;
