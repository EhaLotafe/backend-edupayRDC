import { Router } from "express";
import prisma from "../prisma/client";
// Correction: Utilisation de 'protect' et 'AuthRequest'
import { protect, AuthRequest } from "../middlewares/authMiddleware"; 

const router = Router();

// =========================================================================
// 1. PARENT CRÉE UN PAIEMENT (POST /api/payments)
// Protégé pour le rôle 'parent'
// =========================================================================
router.post("/", protect(["parent"]), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  const user = req.user;
  const { feeId, amount, currency, paymentMethod, transactionId } = req.body;
  
  try {
    const payment = await prisma.payment.create({
      data: { 
        feeId, 
        // Correction: Utilisation de user.id au lieu de user.sub
        parentId: user.id, 
        amount: Number(amount), 
        currency, 
        paymentMethod, 
        status: "pending",
        transactionId,
      }
    });

    // Mettre à jour le statut du frais associé si nécessaire
    // Par exemple, on pourrait mettre le statut de la Fee à 'payment_in_progress' ici
    await prisma.fee.update({
        where: { id: feeId },
        data: { status: 'payment_pending_validation' } 
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error("Erreur lors de la création du paiement:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement." });
  }
});

// =========================================================================
// 2. RÉCUPÉRER TOUS LES PAIEMENTS D’UN PARENT (GET /api/payments/me)
// Protégé pour le rôle 'parent'
// =========================================================================
router.get("/me", protect(["parent"]), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  try {
    const user = req.user;
    // Correction: Utilisation de user.id au lieu de user.sub
    const payments = await prisma.payment.findMany({ 
        where: { parentId: user.id }, 
        include: { 
            fee: {
                include: {
                    child: {
                        select: { name: true, classGrade: true }
                    }
                }
            } 
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements du parent:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des paiements." });
  }
});

// =========================================================================
// 3. ÉCOLE VALIDE OU REFUSE UN PAIEMENT (PUT /api/payments/:id/status)
// Protégé pour le rôle 'school'
// =========================================================================
router.put("/:id/status", protect(["school"]), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  const { status } = req.body; // "completed", "failed"
  const paymentId = req.params.id;
  const schoolId = req.user.id;

  try {
    // 1. Vérifier si le paiement existe et s'il est lié à l'école actuelle
    const paymentToUpdate = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { fee: true }
    });

    if (!paymentToUpdate) {
      return res.status(404).json({ error: "Paiement non trouvé." });
    }
    
    // Vérification de sécurité: l'école qui met à jour le statut doit être l'école qui reçoit le frais
    if (paymentToUpdate.fee.schoolId !== schoolId) {
      return res.status(403).json({ error: "Accès refusé. Ce paiement n'est pas associé à votre école." });
    }

    // 2. Mettre à jour le statut du paiement
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status }
    });

    // 3. Mettre à jour le statut du frais associé si le paiement est 'completed'
    if (status === 'completed') {
        await prisma.fee.update({
            where: { id: paymentToUpdate.feeId },
            data: { status: 'paid' } // Marquer le frais comme payé
        });
    } else if (status === 'failed' || status === 'rejected') {
        await prisma.fee.update({
            where: { id: paymentToUpdate.feeId },
            data: { status: 'pending' } // Remettre le frais en attente si le paiement échoue
        });
    }

    res.json(updatedPayment);

  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du paiement:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut du paiement." });
  }
});

export default router;
