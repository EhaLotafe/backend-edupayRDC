//backend/src/routees/parents.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// =========================================================================
// 1. LISTE DE TOUS LES PARENTS (GET /api/parents) - Protégé pour l'Admin
// =========================================================================
router.get("/", protect(['admin']), async (req, res) => {
  try {
    const parents = await prisma.parent.findMany({
        select: {
            id: true,
            phone: true,
            name: true,
            verified: true,
            createdAt: true,
        }
    });
    res.json(parents);
  } catch (error) {
    console.error("Erreur lors du chargement des parents:", error);
    res.status(500).json({ error: "Erreur lors du chargement des parents" });
  }
});

// =========================================================================
// 2. LISTE DES ENFANTS DU PARENT (GET /api/parents/children) - Protégé pour le Parent
// =========================================================================
router.get("/children", protect(['parent']), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini et a le rôle 'parent'
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié ou données utilisateur manquantes." });
  }

  try {
    // Correction: Utilisation de req.user.id au lieu de req.user.sub
    const parentId = req.user.id; 
    
    const children = await prisma.child.findMany({
      where: { parentId },
      include: { 
        school: {
            select: { name: true }
        },
        fees: {
            where: { status: { not: 'paid' } }, // N'afficher que les frais non payés
            orderBy: { dueDate: 'asc' }
        }
      }
    });
    res.json(children);
  } catch (error) {
    console.error("Erreur lors du chargement des enfants du parent:", error);
    res.status(500).json({ error: "Erreur lors du chargement" });
  }
});


export default router;
