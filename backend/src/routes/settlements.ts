import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/settlements - List all settlements with user details
router.get('/', async (req, res) => {
  try {
    const settlements = await prisma.settlement.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Populate user names for displaying
    const populated = await Promise.all(
      settlements.map(async (s) => {
        const fromUser = await prisma.user.findUnique({
          where: { id: s.fromUserId },
          select: { name: true, avatarUrl: true },
        });
        const toUser = await prisma.user.findUnique({
          where: { id: s.toUserId },
          select: { name: true, avatarUrl: true },
        });

        return {
          ...s,
          fromUser: fromUser || { name: 'Unknown', avatarUrl: null },
          toUser: toUser || { name: 'Unknown', avatarUrl: null },
        };
      })
    );

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settlements/:id/pay - Mark a settlement as paid
router.post('/:id/pay', async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await prisma.settlement.update({
      where: { id: parseInt(id) },
      data: { isPaid: true },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
