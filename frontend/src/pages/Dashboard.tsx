import { useEffect, useState } from 'react';
import { TrendingUp, CreditCard, Wallet, Users, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';

interface Expense {
  id: number;
  title: string;
  totalAmount: string;
  pkAmount: string;
  ncAmount: string;
  paymentCode: string;
  date: string;
  dueDate: string | null;
  creditCardId: number | null;
  creditCard?: { name: string } | null;
}

interface Card { id: number; name: string; statementCycleDay: number; dueDateDay: number; }
interface Settlement { id: number; fromUserId: number; toUserId: number; amount: string; isPaid: boolean; }

interface DueAlert {
  cardName: string;
  dueDate: string;
  total: number;
  pkTotal: number;
  ncTotal: number;
  daysLeft: number;
}

interface PivotData {
  months: { key: string; label: string }[];
  cardMap: Record<string, Record<string, { total: number; pk: number; nc: number }>>;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);
  const [pivot, setPivot] = useState<PivotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pivotView, setPivotView] = useState<'total' | 'pk' | 'nc'>('total');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [expRes, cardRes, setRes, alertRes, pivotRes] = await Promise.all([
          axios.get('/api/expenses'),
          axios.get('/api/cards'),
          axios.get('/api/settlements'),
          axios.get('/api/summary/due-alerts').catch(() => ({ data: [] })),
          axios.get('/api/summary/pivot').catch(() => ({ data: null })),
        ]);
        setExpenses(expRes.data);
        setCards(cardRes.data);
        setSettlements(setRes.data);
        setDueAlerts(alertRes.data);
        setPivot(pivotRes.data);
        setError(null);
      } catch (err: any) {
        setError('ไม่สามารถเชื่อมต่อ Server ได้ กรุณาตรวจสอบว่า Backend และ MySQL กำลังทำงานอยู่');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.totalAmount), 0);
  const pkSpent = expenses.reduce((s, e) => s + parseFloat(e.pkAmount || '0'), 0);
  const ncSpent = expenses.reduce((s, e) => s + parseFloat(e.ncAmount || '0'), 0);
  const moneyOwed = settlements.filter(s => s.toUserId === 1 && !s.isPaid).reduce((s, x) => s + parseFloat(x.amount), 0);

  const stats = [
    { name: 'ยอดรวมทั้งหมด', value: `฿${fmt(totalSpent)}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { name: 'ยอด PK (Golf)', value: `฿${fmt(pkSpent)}`, icon: Wallet, color: 'text-warning', bg: 'bg-warning/20' },
    { name: 'ยอด NC (Nink)', value: `฿${fmt(ncSpent)}`, icon: Users, color: 'text-secondary', bg: 'bg-secondary/20' },
    { name: 'ค้างชำระ', value: `฿${fmt(moneyOwed)}`, icon: CreditCard, color: 'text-success', bg: 'bg-success/20' },
  ];

  // Last 6 months for pivot
  const last6Months = pivot?.months.slice(-6) ?? [];

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">ภาพรวมค่าใช้จ่าย</h1>
        <p className="text-zinc-400 mt-1">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="glass-card p-5 hover:border-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-zinc-400 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Due Date Alerts */}
          {dueAlerts.length > 0 && (
            <div className="glass-card p-5 border border-danger/20">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-danger">⚠️</span>
                <h2 className="font-bold text-zinc-100">แจ้งเตือน Due Date ที่ใกล้มาถึง</h2>
                <span className="text-xs px-2 py-0.5 bg-danger/20 text-danger rounded-full">{dueAlerts.length} รายการ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dueAlerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${alert.daysLeft <= 3 ? 'bg-danger/10 border-danger/30' : 'bg-warning/5 border-warning/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-200 text-sm truncate">{alert.cardName}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${alert.daysLeft <= 3 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                        {alert.daysLeft === 0 ? 'วันนี้!' : `${alert.daysLeft} วัน`}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mb-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Due: {new Date(alert.dueDate).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">PK ฿{fmt(alert.pkTotal)}</span>
                      <span className="text-secondary">NC ฿{fmt(alert.ncTotal)}</span>
                    </div>
                    <p className="text-zinc-100 font-bold text-sm mt-1">รวม ฿{fmt(alert.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pivot Table - Monthly per Card */}
            {pivot && last6Months.length > 0 && (
              <div className="glass-card p-5 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="font-bold text-zinc-100">ยอดรวมต่อบัตร รายเดือน (6 เดือนล่าสุด)</h2>
                  <div className="flex gap-1">
                    {[['total', 'รวม'], ['pk', 'PK'], ['nc', 'NC']].map(([v, label]) => (
                      <button key={v} onClick={() => setPivotView(v as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                          ${pivotView === v ? 'bg-primary text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left py-2.5 px-3 text-zinc-400 font-medium sticky left-0 bg-white/5">บัตรเครดิต</th>
                        {last6Months.map(m => (
                          <th key={m.key} className="text-right py-2.5 px-3 text-zinc-400 font-medium whitespace-nowrap">{m.label}</th>
                        ))}
                        <th className="text-right py-2.5 px-3 text-zinc-300 font-medium">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(pivot.cardMap).map(([cardName, months]) => {
                        const rowTotal = last6Months.reduce((s, m) => s + (months[m.key]?.[pivotView] || 0), 0);
                        if (rowTotal === 0) return null;
                        return (
                          <tr key={cardName} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                            <td className="py-2.5 px-3 text-zinc-300 max-w-[140px] truncate sticky left-0 bg-surface/80" title={cardName}>
                              {cardName}
                            </td>
                            {last6Months.map(m => {
                              const val = months[m.key]?.[pivotView] || 0;
                              return (
                                <td key={m.key} className={`py-2.5 px-3 text-right whitespace-nowrap ${val > 0 ? 'text-zinc-200' : 'text-zinc-600'}`}>
                                  {val > 0 ? `฿${fmt(val)}` : '-'}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 text-right font-bold text-primary whitespace-nowrap">
                              ฿{fmt(rowTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-white/5 border-t border-white/10">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-zinc-200">รวมทั้งหมด</td>
                        {last6Months.map(m => {
                          const colTotal = Object.values(pivot.cardMap).reduce((s, months) => s + (months[m.key]?.[pivotView] || 0), 0);
                          return (
                            <td key={m.key} className="py-2.5 px-3 text-right font-bold text-zinc-100 whitespace-nowrap">
                              {colTotal > 0 ? `฿${fmt(colTotal)}` : '-'}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-bold text-warning whitespace-nowrap">
                          ฿{fmt(Object.entries(pivot.cardMap).reduce((s, [, months]) =>
                            s + last6Months.reduce((ms, m) => ms + (months[m.key]?.[pivotView] || 0), 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            <div className="glass-card p-5">
              <h2 className="font-bold text-zinc-100 mb-4">รายการล่าสุด</h2>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">ยังไม่มีรายการ</p>
                ) : (
                  expenses.slice(0, 6).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-8 rounded-full flex-none
                          ${exp.paymentCode === 'P' ? 'bg-warning' : 'bg-success'}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-200 truncate text-sm">{exp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500">{exp.creditCard?.name || 'Cash'}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                              ${exp.paymentCode === 'P' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                              {exp.paymentCode}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-none ml-2">
                        <p className="font-semibold text-zinc-100 text-sm">฿{fmt(parseFloat(exp.totalAmount))}</p>
                        {parseFloat(exp.pkAmount) > 0 && (
                          <p className="text-xs text-primary">PK ฿{fmt(parseFloat(exp.pkAmount))}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Credit Card Summary (compact) */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-100">สรุปต่อบัตร</h2>
                <a href="#/card-summary" className="text-xs text-primary hover:underline">ดูทั้งหมด →</a>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">ยังไม่มีบัตรเครดิต</p>
                ) : (
                  cards.slice(0, 5).map(card => {
                    const cardTotal = expenses.filter(e => e.creditCardId === card.id)
                      .reduce((s, e) => s + parseFloat(e.totalAmount), 0);
                    const pkTotal = expenses.filter(e => e.creditCardId === card.id)
                      .reduce((s, e) => s + parseFloat(e.pkAmount || '0'), 0);
                    const pct = totalSpent > 0 ? (cardTotal / totalSpent) * 100 : 0;
                    return (
                      <div key={card.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-300 truncate max-w-[140px]" title={card.name}>{card.name}</span>
                          <span className="text-zinc-100 font-medium">฿{fmt(cardTotal)}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">PK ฿{fmt(pkTotal)} · {pct.toFixed(1)}%</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
