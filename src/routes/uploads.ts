import { Router } from "express";
import multer from "multer";
import prisma from "../prisma/client";
// Correction: Utilisation de 'protect' et 'AuthRequest'
import { protect, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();
// Configuration de Multer : Utiliser un nom de fichier unique et garantir le dossier
const upload = multer({ 
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 } // Limite la taille des fichiers à 5MB
});

/**
 * 📤 Route: POST /api/uploads/payment/:id/proof
 * 🔒 Téléchargement d'une preuve de paiement par le Parent
 */
// Correction: Utilisation de protect(['parent'])
router.post("/payment/:id/proof", protect(["parent"]), upload.single("file"), async (req: AuthRequest, res) => {
  // Le middleware 'protect' assure que req.user est défini
  const user = req.user;
  
  // Vérification supplémentaire, bien que 'protect' doive déjà garantir l'accès
  if (!user || user.role !== "parent") {
    return res.status(403).json({ error: "Accès refusé ou non authentifié." });
  }

  // Assurez-vous que le fichier a été téléchargé
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({ error: "Fichier de preuve manquant." });
  }

  try {
    const payment = await prisma.payment.update({
      where: { 
          id: req.params.id, 
          parentId: user.id // S'assurer que le parent met à jour son propre paiement
      },
      // Correction: Stocker directement le chemin d'accès (string)
      data: { receiptData: filePath } 
    });

    res.json({ message: "Preuve de paiement uploadée avec succès.", payment });

  } catch (error) {
    console.error("Erreur lors de l'upload de la preuve:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la preuve." });
  }
});

export default router;
