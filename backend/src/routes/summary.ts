import { Router } from 'express';
import prisma from '../db';

const router = Router();

// ─── Dashboard Pivot: Total per card per month ─────────────────────────────
router.get('/pivot', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { creditCard: true },
      orderBy: { date: 'asc' },
    });

    const monthsSet = new Set<string>();
    const cardMap: Record<string, Record<string, { total: number; pk: number; nc: number }>> = {};

    for (const exp of expenses) {
      const cardName = exp.creditCard?.name || 'Cash';
      const d = new Date(exp.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });

      monthsSet.add(monthKey + '|' + label);

      if (!cardMap[cardName]) cardMap[cardName] = {};
      if (!cardMap[cardName][monthKey]) cardMap[cardName][monthKey] = { total: 0, pk: 0, nc: 0 };

      cardMap[cardName][monthKey].total += parseFloat(exp.totalAmount.toString());
      cardMap[cardName][monthKey].pk += parseFloat(exp.pkAmount.toString());
      cardMap[cardName][monthKey].nc += parseFloat(exp.ncAmount.toString());
    }

    const months = Array.from(monthsSet)
      .sort()
      .map(m => ({ key: m.split('|')[0], label: m.split('|')[1] }));

    res.json({ months, cardMap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Card Summary: Like Pivot_Payment sheet ────────────────────────────────
router.get('/card-summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const where: any = {};

    if (month && year) {
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      where.dueDate = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { creditCard: true, paymentApp: true, category: true },
      orderBy: [{ creditCardId: 'asc' }, { dueDate: 'asc' }, { date: 'desc' }],
    });

    // Group by credit card
    const grouped: Record<string, any[]> = {};
    for (const exp of expenses) {
      const key = exp.creditCard?.name || 'Cash';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: exp.id,
        date: exp.date,
        title: exp.title,
        installmentCurrent: exp.installmentCurrent,
        installmentTotal: exp.installmentTotal,
        dueDate: exp.dueDate,
        paymentCode: exp.paymentCode,
        totalAmount: parseFloat(exp.totalAmount.toString()),
        pkAmount: parseFloat(exp.pkAmount.toString()),
        ncAmount: parseFloat(exp.ncAmount.toString()),
        paymentApp: exp.paymentApp?.name,
        category: exp.category?.name,
      });
    }

    // Summarize totals per card
    const summary = Object.entries(grouped).map(([cardName, items]) => ({
      cardName,
      items,
      totalAmount: items.reduce((s, i) => s + i.totalAmount, 0),
      pkTotal: items.reduce((s, i) => s + i.pkAmount, 0),
      ncTotal: items.reduce((s, i) => s + i.ncAmount, 0),
    }));

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Due Date Alert: Cards with upcoming due dates ─────────────────────────
router.get('/due-alerts', async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate() + 14);

    const upcoming = await prisma.expense.findMany({
      where: {
        dueDate: { gte: today, lte: nextMonth },
        paymentCode: { not: '' },
      },
      include: { creditCard: true },
      orderBy: { dueDate: 'asc' },
    });

    // Group by card+dueDate
    const alertMap: Record<string, { cardName: string; dueDate: Date; total: number; pkTotal: number; ncTotal: number; daysLeft: number }> = {};
    for (const exp of upcoming) {
      const key = `${exp.creditCard?.name || 'Cash'}|${exp.dueDate?.toISOString().split('T')[0]}`;
      if (!alertMap[key]) {
        const daysLeft = Math.ceil((new Date(exp.dueDate!).getTime() - today.getTime()) / 86400000);
        alertMap[key] = {
          cardName: exp.creditCard?.name || 'Cash',
          dueDate: exp.dueDate!,
          total: 0,
          pkTotal: 0,
          ncTotal: 0,
          daysLeft,
        };
      }
      alertMap[key].total += parseFloat(exp.totalAmount.toString());
      alertMap[key].pkTotal += parseFloat(exp.pkAmount.toString());
      alertMap[key].ncTotal += parseFloat(exp.ncAmount.toString());
    }

    res.json(Object.values(alertMap).sort((a, b) => a.daysLeft - b.daysLeft));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
