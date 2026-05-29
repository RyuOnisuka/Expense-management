import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/cards - List all credit cards for the default user
router.get('/', async (req, res) => {
  const userId = 1; // Default Alex user ID

  try {
    const cards = await prisma.creditCard.findMany({
      where: { userId },
    });
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cards - Create a new credit card profile
router.post('/', async (req, res) => {
  const { name, statementCycleDay, dueDateDay } = req.body;
  const userId = 1; // Default Alex user ID

  if (!name || statementCycleDay === undefined || dueDateDay === undefined) {
    return res.status(400).json({ error: 'Name, statement cycle day, and due date day are required' });
  }

  try {
    const card = await prisma.creditCard.create({
      data: {
        name,
        statementCycleDay: parseInt(statementCycleDay),
        dueDateDay: parseInt(dueDateDay),
        userId,
      },
    });
    res.status(201).json(card);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cards/:id - Delete a credit card profile
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.creditCard.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Credit card deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
