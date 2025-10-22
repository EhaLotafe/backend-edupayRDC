import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middlewares/authMiddleware';
import { ParamsDictionary } from 'express-serve-static-core';

const router = Router();
const prisma = new PrismaClient();

// -------------------------------------------------------------
// 🧱 Interface TypedRequest pour typer proprement les params
// -------------------------------------------------------------
interface TypedRequest<
  P extends ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {}

// -------------------------------------------------------------
// 1️⃣ STATISTIQUES GLOBALES (GET /api/admin/stats)
// -------------------------------------------------------------
router.get('/stats', protect(['admin']), async (req: Request, res: Response) => {
  try {
    const totalSchools = await prisma.school.count();
    const approvedSchools = await prisma.school.count({
      where: { isApproved: true },
    });
    const totalParents = await prisma.parent.count();
    const totalPayments = await prisma.payment.count();

    const totalPaidAmountResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' },
    });

    res.json({
      message: 'Statistiques récupérées avec succès.',
      data: {
        schools: totalSchools,
        approvedSchools,
        parents: totalParents,
        payments: totalPayments,
        totalPaidAmount: totalPaidAmountResult._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Erreur /stats :', error);
    res
      .status(500)
      .json({ message: 'Erreur interne du serveur lors du calcul des statistiques.' });
  }
});

// -------------------------------------------------------------
// 2️⃣ LISTE DES ÉCOLES (GET /api/admin/schools)
// -------------------------------------------------------------
router.get('/schools', protect(['admin']), async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      message: 'Liste des écoles récupérée avec succès.',
      data: schools.map((s) => ({
        ...s,
        isApproved: s.isApproved ?? false,
      })),
    });
  } catch (error) {
    console.error('Erreur /schools :', error);
    res.status(500).json({ message: "Erreur lors de la récupération des écoles." });
  }
});

// -------------------------------------------------------------
// 3️⃣ APPROBATION D’UNE ÉCOLE (PUT /api/admin/schools/:schoolId/approve)
// -------------------------------------------------------------
router.put(
  '/schools/:schoolId/approve',
  protect(['admin']),
  async (req: TypedRequest<{ schoolId: string }>, res: Response) => {
    const { schoolId } = req.params;
    const { approve } = req.body;

    if (typeof approve !== 'boolean') {
      return res
        .status(400)
        .json({ message: "Le champ 'approve' est requis et doit être un booléen." });
    }

    try {
      const updatedSchool = await prisma.school.update({
        where: { id: schoolId },
        data: { isApproved: approve },
        select: { id: true, name: true, isApproved: true },
      });

      res.json({
        message: `École ${updatedSchool.name} ${
          approve ? 'approuvée' : 'désapprouvée'
        } avec succès.`,
        school: updatedSchool,
      });
    } catch (error) {
      console.error('Erreur /schools/:id/approve :', error);
      res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour du statut de l'école." });
    }
  }
);

// -------------------------------------------------------------
// 4️⃣ LISTE DES PARENTS (GET /api/admin/parents)
// -------------------------------------------------------------
router.get('/parents', protect(['admin']), async (req: Request, res: Response) => {
  try {
    const parents = await prisma.parent.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        verified: true,
        createdAt: true,
        _count: { select: { children: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      message: 'Liste des parents récupérée avec succès.',
      data: parents.map((p) => ({
        id: p.id,
        phone: p.phone,
        name: p.name,
        verified: p.verified,
        childCount: p._count.children,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Erreur /parents :', error);
    res.status(500).json({ message: "Erreur lors de la récupération des parents." });
  }
});

// -------------------------------------------------------------
// 5️⃣ VÉRIFICATION D’UN PARENT (PUT /api/admin/parents/:parentId/verify)
// -------------------------------------------------------------
router.put(
  '/parents/:parentId/verify',
  protect(['admin']),
  async (req: TypedRequest<{ parentId: string }>, res: Response) => {
    const { parentId } = req.params;
    const { verify } = req.body;

    if (typeof verify !== 'boolean') {
      return res
        .status(400)
        .json({ message: "Le champ 'verify' est requis et doit être un booléen." });
    }

    try {
      const updatedParent = await prisma.parent.update({
        where: { id: parentId },
        data: { verified: verify },
        select: { id: true, phone: true, verified: true },
      });

      res.json({
        message: `Parent ${updatedParent.phone} ${
          verify ? 'vérifié' : 'non vérifié'
        } avec succès.`,
        parent: updatedParent,
      });
    } catch (error) {
      console.error('Erreur /parents/:id/verify :', error);
      res
        .status(500)
        .json({ message: 'Erreur lors de la mise à jour du statut du parent.' });
    }
  }
);

// -------------------------------------------------------------
// 6️⃣ HISTORIQUE DES PAIEMENTS (GET /api/admin/payments)
// -------------------------------------------------------------
router.get('/payments', protect(['admin']), async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        parent: { select: { name: true, phone: true } },
        fee: { select: { feeType: true, school: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      message: 'Historique des paiements récupéré avec succès.',
      data: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
        parentName: p.parent.name || p.parent.phone,
        feeType: p.fee.feeType,
        schoolName: p.fee.school.name,
      })),
    });
  } catch (error) {
    console.error('Erreur /payments :', error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des paiements." });
  }
});

export default router;
