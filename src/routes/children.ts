//src/routes/children.ts
import { Router } from "express";
import prisma from "../prisma/client";
import { protect, AuthRequest } from "../middlewares/authMiddleware"; // J'ai remplacé verifyTokenMiddleware par protect pour la cohérence

const router = Router();

// =========================================================================
// 1. ENREGISTRER UN NOUVEL ENFANT (POST /api/children)
// La route est désormais protégée et requiert le rôle 'parent'
// =========================================================================

router.post("/", protect(["parent"]), async (req: AuthRequest, res) => {
  // Assurez-vous que l'utilisateur est présent (bien que 'protect' doive déjà garantir cela)
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié ou données utilisateur manquantes." });
  }

  const user = req.user;
  
  // Le middleware 'protect(["parent"])' garantit déjà que le rôle est "parent".
  // Cette vérification est redondante si 'protect' est bien configuré,
  // mais elle peut servir de garde-fou supplémentaire.
  if (user.role !== "parent") return res.status(403).json({ error: "Accès refusé" });
  
  const { name, classGrade, schoolId, schoolStudentId } = req.body;

  try {
    const child = await prisma.child.create({
      data: {
        name,
        classGrade,
        schoolId,
        parentId: user.id, // Utilisation de user.id au lieu de user.sub
        // schoolStudentId n'est pas dans le schéma prisma actuel, j'ai donc retiré son insertion
      },
    });
    res.status(201).json(child);
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'enfant:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout de l'enfant." });
  }
});

// =========================================================================
// 2. RÉCUPÉRER LES ENFANTS DU PARENT (GET /api/children)
// =========================================================================

router.get("/", protect(["parent"]), async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié." });

    try {
        const children = await prisma.child.findMany({
            where: {
                parentId: req.user.id // Utilisation de user.id
            },
            include: {
                school: {
                    select: { name: true, email: true }
                },
                fees: {
                    where: { status: { not: 'paid' } }, // Afficher les frais non payés
                    orderBy: { dueDate: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(children);
    } catch (error) {
        console.error("Erreur lors de la récupération des enfants:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des enfants." });
    }
});


export default router;
// =========================================================================
// FIN DU FICHIER
// =========================================================================