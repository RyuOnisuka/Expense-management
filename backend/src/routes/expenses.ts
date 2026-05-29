import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/expenses - List all expenses with their items
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        items: true,
        creditCard: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses - Create a new master expense with items and distribute settlements
router.post('/', async (req, res) => {
  const { title, totalAmount, creditCardId, items, discountTax } = req.body;
  const userId = 1; // Default Alex user ID

  if (!title || !totalAmount || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Title, totalAmount, and items array are required' });
  }

  try {
    // 1. Create the Master Expense and associated Line Items
    const expense = await prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          title,
          totalAmount: parseFloat(totalAmount),
          creditCardId: creditCardId ? parseInt(creditCardId) : null,
          userId,
          items: {
            create: items.map((item: any) => ({
              name: item.name,
              price: parseFloat(item.price),
              assignee: item.assignee, // 'personal', 'shared', 'mark', 'sarah', etc.
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Settlement Calculations
      const subTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
      const taxAndDiscount = parseFloat(discountTax || 0);

      // We have standard users: Alex (ID: 1, 'alex'), Mark (ID: 2, 'mark'), Sarah (ID: 3, 'sarah')
      // Make sure Mark (ID: 2) and Sarah (ID: 3) exist in the DB, if not, create them!
      const userMark = await tx.user.upsert({
        where: { email: 'mark@example.com' },
        update: {},
        create: {
          id: 2,
          name: 'Mark',
          email: 'mark@example.com',
          password: 'password123',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        },
      });

      const userSarah = await tx.user.upsert({
        where: { email: 'sarah@example.com' },
        update: {},
        create: {
          id: 3,
          name: 'Sarah',
          email: 'sarah@example.com',
          password: 'password123',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
      });

      // Calculate shares proportionally
      const getProportionalShare = (assignee: string) => {
        const rawSum = items
          .filter((i: any) => {
            if (assignee === 'shared' && i.assignee === 'shared') return true;
            if (i.assignee === assignee) return true;
            return false;
          })
          .reduce((sum: number, item: any) => sum + (assignee === 'shared' ? parseFloat(item.price) : item.assignee === 'shared' ? parseFloat(item.price) / 3 : parseFloat(item.price)), 0);

        const ratio = subTotal > 0 ? rawSum / subTotal : 0;
        const taxShare = taxAndDiscount * ratio;
        return rawSum + taxShare;
      };

      // Calculate final share for each person
      const markShare = getProportionalShare('mark');
      const sarahShare = getProportionalShare('sarah');

      // Update settlements: Mark owes Alex, Sarah owes Alex
      if (markShare > 0) {
        await tx.settlement.create({
          data: {
            fromUserId: userMark.id,
            toUserId: userId, // Alex
            amount: markShare,
            isPaid: false,
          },
        });
      }

      if (sarahShare > 0) {
        await tx.settlement.create({
          data: {
            fromUserId: userSarah.id,
            toUserId: userId, // Alex
            amount: sarahShare,
            isPaid: false,
          },
        });
      }

      return createdExpense;
    });

    res.status(201).json(expense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
