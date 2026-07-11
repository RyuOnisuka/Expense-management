import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import cardRoutes from './routes/cards';
import expenseRoutes from './routes/expenses';
import settlementRoutes from './routes/settlements';
import importRoutes from './routes/import';
import masterRoutes from './routes/master';
import summaryRoutes from './routes/summary';
import installmentRoutes from './routes/installments';
import prisma from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/import', importRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/installments', installmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auto-seed default user and master data on startup
async function seedDefaults() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          {
            id: 1,
            name: 'Golf (PK)',
            email: 'pk@example.com',
            password: 'password123',
            code: 'PK',
            color: '#3b82f6',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          },
          {
            id: 2,
            name: 'Nink (NC)',
            email: 'nc@example.com',
            password: 'password123',
            code: 'NC',
            color: '#8b5cf6',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          },
        ],
      });
      console.log('✅ Seeded default users: Golf (PK) and Nink (NC)');
    }

    // Seed default payment apps
    const appCount = await prisma.paymentApp.count();
    if (appCount === 0) {
      await prisma.paymentApp.createMany({
        data: [
          { name: 'K PLUS', icon: '💳' },
          { name: 'SpayLater', icon: '🛒' },
          { name: 'PromptPay', icon: '📱' },
          { name: 'SCB Easy', icon: '💜' },
          { name: 'Krungthai NEXT', icon: '🏦' },
        ],
      });
      console.log('✅ Seeded default payment apps');
    }

    // Seed default categories
    const catCount = await prisma.expenseCategory.count();
    if (catCount === 0) {
      await prisma.expenseCategory.createMany({
        data: [
          { name: 'อาหาร', icon: '🍜', color: '#f59e0b' },
          { name: 'ช้อปปิ้ง', icon: '🛍️', color: '#8b5cf6' },
          { name: 'ประกัน', icon: '🛡️', color: '#3b82f6' },
          { name: 'สาธารณูปโภค', icon: '💡', color: '#10b981' },
          { name: 'บันเทิง', icon: '🎮', color: '#ef4444' },
          { name: 'การแพทย์', icon: '🏥', color: '#06b6d4' },
          { name: 'เดินทาง', icon: '🚗', color: '#84cc16' },
          { name: 'อื่นๆ', icon: '📦', color: '#6b7280' },
        ],
      });
      console.log('✅ Seeded default categories');
    }
  } catch (error) {
    console.error('Error seeding defaults:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await seedDefaults();
});
