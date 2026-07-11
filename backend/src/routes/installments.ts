import { Router } from 'express';
import prisma from '../db';

const router = Router();

// List all installments
router.get('/', async (req, res) => {
  try {
    const installments = await prisma.installment.findMany({
      include: { creditCard: true },
      orderBy: { startDate: 'desc' },
    });
    res.json(installments.map(inst => ({
      ...inst,
      totalAmount: parseFloat(inst.totalAmount.toString()),
      monthlyAmount: parseFloat(inst.monthlyAmount.toString()),
      remainingAmount: parseFloat(inst.totalAmount.toString()) - parseFloat(inst.monthlyAmount.toString()) * inst.currentPeriod,
      progressPct: inst.totalPeriods > 0 ? Math.round((inst.currentPeriod / inst.totalPeriods) * 100) : 0,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create installment
router.post('/', async (req, res) => {
  const { name, totalAmount, monthlyAmount, totalPeriods, currentPeriod, startDate, creditCardId } = req.body;
  if (!name || !totalAmount || !monthlyAmount || !totalPeriods || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const inst = await prisma.installment.create({
      data: {
        name,
        totalAmount: parseFloat(totalAmount),
        monthlyAmount: parseFloat(monthlyAmount),
        totalPeriods: parseInt(totalPeriods),
        currentPeriod: parseInt(currentPeriod) || 0,
        startDate: new Date(startDate),
        creditCardId: creditCardId ? parseInt(creditCardId) : null,
        userId: 1,
      },
      include: { creditCard: true },
    });
    res.status(201).json(inst);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update period / active status
router.put('/:id', async (req, res) => {
  const { currentPeriod, isActive } = req.body;
  try {
    const inst = await prisma.installment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(currentPeriod !== undefined && { currentPeriod: parseInt(currentPeriod) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: { creditCard: true },
    });
    res.json(inst);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete installment
router.delete('/:id', async (req, res) => {
  await prisma.installment.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// Monthly summary (total installment per month)
router.get('/monthly', async (req, res) => {
  try {
    const installments = await prisma.installment.findMany({
      where: { isActive: true },
      include: { creditCard: true },
    });

    const monthly: Record<string, { total: number; items: { name: string; amount: number; card: string }[] }> = {};

    for (const inst of installments) {
      const startDate = new Date(inst.startDate);
      for (let i = 0; i < inst.totalPeriods; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { total: 0, items: [] };
        const amt = parseFloat(inst.monthlyAmount.toString());
        monthly[key].total += amt;
        monthly[key].items.push({
          name: inst.name,
          amount: amt,
          card: inst.creditCard?.name || 'Unknown',
        });
      }
    }

    res.json(monthly);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
