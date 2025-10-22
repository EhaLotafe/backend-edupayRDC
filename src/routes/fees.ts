import { Router } from "express";
import prisma from "../prisma/client";
import { protect, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

// =========================================================================
// 1. CRÉER UN NOUVEAU FRAIS SCOLAIRE (POST /api/fees/create)
// La route est protégée et requiert le rôle 'school'
// =========================================================================

router.post("/create", protect(["school"]), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini
  if (!req.user || req.user.role !== "school") {
    return res.status(403).json({ error: "Accès refusé ou utilisateur non défini." });
  }

  const user = req.user;

  const { childId, feeType, amount, currency, dueDate, description } = req.body;

  try {
    const fee = await prisma.fee.create({
      data: {
        childId,
        schoolId: user.id, // Correction: Utilisation de user.id au lieu de user.sub
        feeType,
        amount: Number(amount),
        currency,
        dueDate: new Date(dueDate),
        description,
      },
    });
    res.status(201).json(fee);
  } catch (error) {
    console.error("Erreur lors de la création du frais:", error);
    res.status(500).json({ error: "Erreur lors de la création du frais." });
  }
});

// =========================================================================
// 2. RÉCUPÉRER LES FRAIS PAR ENFANT (GET /api/fees/child/:id)
// Protégé pour s'assurer que seul le parent ou l'école peut voir
// =========================================================================

router.get("/child/:id", protect(["parent", "school"]), async (req: AuthRequest, res) => {
  const childId = req.params.id;

  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }
  
  try {
    const fees = await prisma.fee.findMany({
      where: { 
        childId: childId 
      },
      include: {
        school: {
          select: { name: true }
        },
        child: {
          select: { name: true, parentId: true }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Logique de sécurité pour s'assurer que seul le parent de l'enfant
    // ou l'école qui a créé le frais peut voir la liste complète.
    if (fees.length > 0) {
      const isParent = req.user.role === 'parent' && fees[0].child.parentId === req.user.id;
      const isSchool = req.user.role === 'school' && fees[0].schoolId === req.user.id;

      if (!isParent && !isSchool) {
        return res.status(403).json({ error: "Accès non autorisé à ces frais." });
      }
    }


    res.json(fees);
  } catch (error) {
    console.error("Erreur lors de la récupération des frais de l'enfant:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des frais." });
  }
});

export default router;
