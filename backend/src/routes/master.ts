import { Router } from 'express';
import prisma from '../db';

const router = Router();

// ─── Payment Apps ─────────────────────────────────────────────────────────────
router.get('/payment-apps', async (req, res) => {
  const apps = await prisma.paymentApp.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json(apps);
});

router.post('/payment-apps', async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const app = await prisma.paymentApp.create({ data: { name, icon } });
    res.status(201).json(app);
  } catch (err: any) { res.status(400).json({ error: 'Name already exists' }); }
});

router.delete('/payment-apps/:id', async (req, res) => {
  await prisma.paymentApp.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
  res.json({ success: true });
});

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  const cats = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
  res.json(cats);
});

router.post('/categories', async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const cat = await prisma.expenseCategory.create({ data: { name, icon, color: color || '#6366f1' } });
    res.status(201).json(cat);
  } catch (err: any) { res.status(400).json({ error: 'Name already exists' }); }
});

router.delete('/categories/:id', async (req, res) => {
  await prisma.expenseCategory.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

export default router;
