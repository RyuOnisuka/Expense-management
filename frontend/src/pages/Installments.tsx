import { useState, useEffect } from 'react';
import axios from 'axios';

interface InstallmentItem {
  id: number;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  totalPeriods: number;
  currentPeriod: number;
  remainingAmount: number;
  progressPct: number;
  startDate: string;
  isActive: boolean;
  creditCard?: { id: number; name: string };
}

interface Card {
  id: number;
  name: string;
}

export default function Installments() {
  const [items, setItems] = useState<InstallmentItem[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', totalAmount: '', monthlyAmount: '',
    totalPeriods: '', currentPeriod: '0',
    startDate: new Date().toISOString().slice(0, 10),
    creditCardId: '',
  });

  const fetch = async () => {
    setLoading(true);
    try {
      const [inst, cardRes] = await Promise.all([
        axios.get('/api/installments'),
        axios.get('/api/cards'),
      ]);
      setItems(inst.data);
      setCards(cardRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/installments', {
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        monthlyAmount: parseFloat(form.monthlyAmount),
        totalPeriods: parseInt(form.totalPeriods),
        currentPeriod: parseInt(form.currentPeriod),
        creditCardId: form.creditCardId || null,
      });
      setShowForm(false);
      setForm({ name: '', totalAmount: '', monthlyAmount: '', totalPeriods: '', currentPeriod: '0', startDate: new Date().toISOString().slice(0, 10), creditCardId: '' });
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  const updatePeriod = async (id: number, delta: number, current: number, total: number) => {
    const next = Math.max(0, Math.min(total, current + delta));
    try {
      await axios.put(`/api/installments/${id}`, { currentPeriod: next });
      fetch();
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('ลบรายการผ่อนชำระนี้?')) return;
    await axios.delete(`/api/installments/${id}`);
    fetch();
  };

  const totalMonthly = items.filter(i => i.isActive).reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = items.filter(i => i.isActive).reduce((s, i) => s + i.remainingAmount, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">ติดตามการผ่อนชำระ</h1>
            <p className="text-zinc-400 mt-1">ตารางผ่อนสินค้าและบริการ (เหมือน SumInstallment)</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ ปิด' : '+ เพิ่มรายการ'}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <p className="text-zinc-400 text-sm">ยอดผ่อนรายเดือน (active)</p>
            <p className="text-2xl font-bold text-warning mt-1">฿{fmt(totalMonthly)}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-zinc-400 text-sm">ยอดคงเหลือทั้งหมด</p>
            <p className="text-2xl font-bold text-danger mt-1">฿{fmt(totalRemaining)}</p>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">เพิ่มรายการผ่อนชำระ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-zinc-400 text-sm mb-1.5">ชื่อสินค้า/บริการ</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="เช่น iPhone 16 Pro Max" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">ราคารวม (บาท)</label>
                <input required type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="49900" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">ผ่อนต่อเดือน (บาท)</label>
                <input required type="number" value={form.monthlyAmount} onChange={e => setForm(f => ({ ...f, monthlyAmount: e.target.value }))}
                  placeholder="1360.83" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">จำนวนงวดทั้งหมด</label>
                <input required type="number" value={form.totalPeriods} onChange={e => setForm(f => ({ ...f, totalPeriods: e.target.value }))}
                  placeholder="36" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">ผ่อนแล้ว (งวด)</label>
                <input type="number" value={form.currentPeriod} onChange={e => setForm(f => ({ ...f, currentPeriod: e.target.value }))}
                  placeholder="0" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">วันที่เริ่มต้น</label>
                <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="input-field w-full" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">บัตรเครดิต</label>
                <select value={form.creditCardId} onChange={e => setForm(f => ({ ...f, creditCardId: e.target.value }))}
                  className="input-field w-full">
                  <option value="">เลือกบัตร (ไม่บังคับ)</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">ยกเลิก</button>
              <button type="submit" className="btn-primary flex-1">บันทึก</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-zinc-400">ยังไม่มีรายการผ่อนชำระ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const endDate = new Date(item.startDate);
              endDate.setMonth(endDate.getMonth() + item.totalPeriods);
              const finished = item.currentPeriod >= item.totalPeriods;

              return (
                <div key={item.id} className={`glass-card p-5 ${!item.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-zinc-100 truncate">{item.name}</h3>
                        {item.creditCard && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-md whitespace-nowrap">
                            {item.creditCard.name}
                          </span>
                        )}
                        {finished && (
                          <span className="px-2 py-0.5 bg-success/20 text-success text-xs rounded-md">✅ ชำระครบ</span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm mt-0.5">
                        ราคารวม <span className="text-zinc-300">฿{fmt(item.totalAmount)}</span> ·
                        ฿{fmt(item.monthlyAmount)} / เดือน
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-zinc-500 hover:text-danger transition-colors">
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-zinc-400">
                        งวดที่ <span className={`font-bold ${finished ? 'text-success' : 'text-primary'}`}>
                          {item.currentPeriod}
                        </span> / {item.totalPeriods}
                      </span>
                      <span className={`font-semibold ${finished ? 'text-success' : 'text-warning'}`}>
                        {finished ? 'ชำระครบแล้ว' : `เหลือ ฿${fmt(item.remainingAmount)}`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${finished ? 'bg-success' : 'bg-gradient-to-r from-primary to-secondary'}`}
                        style={{ width: `${item.progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-zinc-500">
                      <span>{new Date(item.startDate).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}</span>
                      <span>{item.progressPct}%</span>
                      <span>{endDate.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Period Controls */}
                  {!finished && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">อัพเดทงวด:</span>
                      <button
                        onClick={() => updatePeriod(item.id, -1, item.currentPeriod, item.totalPeriods)}
                        disabled={item.currentPeriod <= 0}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-sm disabled:opacity-30"
                      >−</button>
                      <span className="text-zinc-300 text-sm font-medium w-6 text-center">{item.currentPeriod}</span>
                      <button
                        onClick={() => updatePeriod(item.id, 1, item.currentPeriod, item.totalPeriods)}
                        disabled={item.currentPeriod >= item.totalPeriods}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-sm disabled:opacity-30"
                      >+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
