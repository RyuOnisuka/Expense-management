import { useEffect, useState } from 'react';
import { TrendingUp, CreditCard, ArrowRight, Wallet, Users, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Expense {
  id: number;
  title: string;
  totalAmount: string;
  date: string;
  creditCardId: number | null;
  creditCard?: { name: string } | null;
  items?: any[];
}

interface Card {
  id: number;
  name: string;
  statementCycleDay: number;
  dueDateDay: number;
}

interface Settlement {
  id: number;
  fromUserId: number;
  toUserId: number;
  amount: string;
  isPaid: boolean;
  fromUser: { name: string; avatarUrl: string };
  toUser: { name: string; avatarUrl: string };
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [expRes, cardRes, setRes] = await Promise.all([
          axios.get('/api/expenses'),
          axios.get('/api/cards'),
          axios.get('/api/settlements')
        ]);
        setExpenses(expRes.data);
        setCards(cardRes.data);
        setSettlements(setRes.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not connect to the backend server. Please make sure MySQL XAMPP and the backend server are running.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate Metrics from DB
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.totalAmount), 0);
  
  const cashSpent = expenses
    .filter(exp => !exp.creditCardId)
    .reduce((sum, exp) => sum + parseFloat(exp.totalAmount), 0);

  const cardSpent = expenses
    .filter(exp => exp.creditCardId)
    .reduce((sum, exp) => sum + parseFloat(exp.totalAmount), 0);

  // Money Owed to Me (Alex is ID: 1, so fromUserId is other people, toUserId is 1, and not paid)
  const moneyOwedToMe = settlements
    .filter(s => s.toUserId === 1 && !s.isPaid)
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const stats = [
    { name: 'Total Spent (This Month)', value: `฿${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { name: 'Cash Spending', value: `฿${cashSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: 'text-warning', bg: 'bg-warning/20' },
    { name: 'Credit Card Spending', value: `฿${cardSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-secondary', bg: 'bg-secondary/20' },
    { name: 'Money Owed to Me', value: `฿${moneyOwedToMe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Users, color: 'text-success', bg: 'bg-success/20' },
  ];

  // Dynamic Upcoming Bills based on Credit Card profiles
  const upcomingBills = cards.map(card => {
    // Basic calculation for due date (Current month and year)
    const today = new Date();
    const currentMonth = today.getMonth();
    const dueDay = card.dueDateDay;
    const dueDate = new Date(today.getFullYear(), currentMonth, dueDay);
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1); // Next month's due date
    }
    
    // Calculate total amount spent on this card
    const cardExpensesSum = expenses
      .filter(exp => exp.creditCardId === card.id)
      .reduce((sum, exp) => sum + parseFloat(exp.totalAmount), 0);

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: card.id,
      name: card.name,
      date: `Due in ${diffDays} days (${dueDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })})`,
      amount: `฿${cardExpensesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isUrgent: diffDays <= 7,
    };
  });

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Alex</h1>
        <p className="text-zinc-400">Here's your financial summary for {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 text-danger mb-6">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="glass-card p-5 group hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-zinc-400 text-sm font-medium mb-1">{stat.name}</h3>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Upcoming CC Bills */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Upcoming Card Bills</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-zinc-400">Auto calculated</span>
              </div>
              <div className="space-y-4">
                {upcomingBills.length === 0 ? (
                  <p className="text-zinc-500 text-center py-10">No credit card profiles added yet.</p>
                ) : (
                  upcomingBills.map((bill) => (
                    <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <div className={`w-2 h-10 rounded-full ${bill.isUrgent ? 'bg-danger' : 'bg-primary'}`}></div>
                        <div>
                          <h4 className="font-semibold text-white">{bill.name}</h4>
                          <p className={`text-sm ${bill.isUrgent ? 'text-danger font-medium' : 'text-zinc-400'}`}>
                            {bill.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-white">{bill.amount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Split Expenses */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Recent Expenses</h2>
              </div>
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-zinc-500 text-center py-10">No expenses recorded yet.</p>
                ) : (
                  expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                      <div>
                        <h4 className="font-medium text-white">{expense.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                            {expense.creditCard ? `Credit Card (${expense.creditCard.name})` : 'Cash'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(expense.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="font-semibold text-white">
                        ฿{parseFloat(expense.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
