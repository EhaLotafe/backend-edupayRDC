import { Router } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt"; // Assurez-vous que signToken utilise 'id' et 'role' dans le payload

const router = Router();

// Hacher l'OTP avant de le stocker
const hashOtp = async (otp: string) => {
    // Utiliser un salt plus léger pour les OTPs (plus rapide que le mot de passe standard)
    return bcrypt.hash(otp, 8); 
};

// Vérifier l'OTP haché
const compareOtp = async (otp: string, hashedOtp: string) => {
    return bcrypt.compare(otp, hashedOtp);
};

// ------------------------------------
// 🏫 Routes École
// ------------------------------------

// Inscription de l'école
router.post("/register-school", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Nom, email et mot de passe requis." });
    }

    const existing = await prisma.school.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email déjà utilisé par une école." });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // isApproved est à false par défaut dans le schéma.
    const school = await prisma.school.create({ 
        data: { name, email, password: hashed, isApproved: false } 
    });
    
    // Retirer le mot de passe avant d'envoyer la réponse
    const { password: _, ...schoolData } = school;
    res.status(201).json({ 
        school: schoolData, 
        message: "Inscription réussie. En attente d'approbation par l'administrateur." 
    });

  } catch (error) {
    console.error("Erreur d'inscription école:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription de l'école." });
  }
});

// Connexion de l'école
router.post("/login-school", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const school = await prisma.school.findUnique({ where: { email } });
    if (!school) {
      return res.status(404).json({ error: "École introuvable." });
    }

    if (!school.isApproved) {
        return res.status(403).json({ error: "Votre compte est en attente d'approbation par l'administrateur." });
    }

    const ok = await bcrypt.compare(password, school.password);
    if (!ok) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }
    
    // Utilisation de 'id' pour la cohérence avec AuthRequest
    const token = signToken({ id: school.id, role: "school" }); 
    
    const { password: _, ...schoolData } = school;
    res.json({ token, school: schoolData });

  } catch (error) {
    console.error("Erreur de connexion école:", error);
    res.status(500).json({ error: "Erreur serveur lors de la connexion de l'école." });
  }
});

// ------------------------------------
// 👨‍👩‍👧‍👦 Routes Parent (Connexion par OTP)
// ------------------------------------

// Demander un OTP pour authentification ou inscription
router.post("/request-otp", async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Numéro de téléphone requis." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min d'expiration
    const hashedOtp = await hashOtp(otp); // Hacher l'OTP

    // Crée le parent si le téléphone n'existe pas, sinon met à jour l'OTP
    let parent = await prisma.parent.upsert({
      where: { phone },
      update: { otp: hashedOtp, otpExpiry, name },
      create: { phone, name, otp: hashedOtp, otpExpiry, verified: false },
    });

    // NOTE: En production, cette console.log doit être remplacée par l'envoi réel de SMS.
    console.log(`[SIMULATE SMS] OTP pour ${phone}: ${otp}`); 
    
    res.json({ message: "OTP généré et envoyé au numéro de téléphone." });

  } catch (error) {
    console.error("Erreur lors de la demande d'OTP:", error);
    res.status(500).json({ error: "Erreur serveur lors de la génération de l'OTP." });
  }
});

// Vérifier l'OTP et générer le token
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Téléphone et OTP requis." });
    }

    const parent = await prisma.parent.findUnique({ where: { phone } });
    if (!parent) {
      return res.status(404).json({ error: "Parent introuvable." });
    }

    if (!parent.otp || !parent.otpExpiry) {
        return res.status(400).json({ error: "Aucun OTP en attente pour ce numéro." });
    }

    // Vérifier l'expiration
    if (parent.otpExpiry < new Date()) {
        // Optionnel: nettoyer l'OTP expiré
        await prisma.parent.update({ where: { phone }, data: { otp: null, otpExpiry: null } });
        return res.status(400).json({ error: "OTP expiré. Veuillez en demander un nouveau." });
    }
    
    // Comparer l'OTP fourni avec l'OTP haché dans la DB
    const isOtpValid = await compareOtp(otp, parent.otp);

    if (!isOtpValid) {
        return res.status(400).json({ error: "OTP invalide." });
    }

    // OTP valide : Générer le token et nettoyer la DB
    const token = signToken({ id: parent.id, role: "parent" });

    const updatedParent = await prisma.parent.update({
      where: { phone },
      data: { otp: null, otpExpiry: null, verified: true },
    });
    
    const { otp: _, otpExpiry: __, ...parentData } = updatedParent; // Nettoyage avant réponse
    res.json({ token, parent: parentData, message: "Connexion réussie." });

  } catch (error) {
    console.error("Erreur lors de la vérification d'OTP:", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification de l'OTP." });
  }
});


// ------------------------------------
// 👑 Route SuperUser (à utiliser avec précaution)
// ------------------------------------

// SuperUser login
router.post("/login-admin", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        const admin = await prisma.superUser.findUnique({ where: { email } });
        if (!admin) {
            return res.status(404).json({ error: "Administrateur introuvable." });
        }

        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }
        
        // Utilisation de 'id' pour la cohérence avec AuthRequest
        const token = signToken({ id: admin.id, role: "admin" }); 
        
        const { password: _, ...adminData } = admin;
        res.json({ token, user: adminData, role: admin.role });

    } catch (error) {
        console.error("Erreur de connexion admin:", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion admin." });
    }
});

export default router;
