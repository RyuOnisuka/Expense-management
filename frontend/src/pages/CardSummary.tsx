import { useState, useEffect } from 'react';
import axios from 'axios';

interface ExpenseItem {
  id: number;
  date: string;
  title: string;
  installmentCurrent: number;
  installmentTotal: number;
  dueDate: string | null;
  paymentCode: string;
  totalAmount: number;
  pkAmount: number;
  ncAmount: number;
  paymentApp?: string;
  category?: string;
}

interface CardGroup {
  cardName: string;
  items: ExpenseItem[];
  totalAmount: number;
  pkTotal: number;
  ncTotal: number;
}

export default function CardSummary() {
  const [data, setData] = useState<CardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState<'ALL' | 'P' | 'S'>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (month && year) { params.month = month; params.year = year; }
      const res = await axios.get('/api/summary/card-summary', { params });
      setData(res.data);
      if (res.data.length > 0 && !expandedCard) setExpandedCard(res.data[0].cardName);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const fmt = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';

  const totalAll = data.reduce((s, c) => s + c.totalAmount, 0);
  const pkAll = data.reduce((s, c) => s + c.pkTotal, 0);
  const ncAll = data.reduce((s, c) => s + c.ncTotal, 0);

  const today = new Date();
  const isDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 7;
  };

  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">สรุปยอดบัตรเครดิต</h1>
            <p className="text-zinc-400 mt-1">รายละเอียดค่าใช้จ่ายแยกตามบัตร (เหมือน Sheet Pivot_Payment)</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select value={month} onChange={e => setMonth(e.target.value)}
              className="input-field text-sm">
              <option value="">ทุกเดือน</option>
              {months.map((m, i) => <option key={m} value={m}>{monthNames[i]}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="input-field text-sm">
              <option value="">ทุกปี</option>
              {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {['ALL', 'P', 'S'].map(code => (
              <button key={code} onClick={() => setFilterCode(code as any)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                  ${filterCode === code
                    ? code === 'ALL' ? 'bg-white/15 text-zinc-100' : code === 'P' ? 'bg-warning/30 text-warning' : 'bg-success/30 text-success'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                {code === 'ALL' ? 'ทั้งหมด' : code === 'P' ? '🔵 Personal' : '🟢 Shared'}
              </button>
            ))}
          </div>
        </div>

        {/* Grand Totals */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'ยอดรวมทั้งหมด', value: totalAll, color: 'text-zinc-100', bg: 'bg-white/5' },
            { label: 'ยอด PK (Golf)', value: pkAll, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'ยอด NC (Nink)', value: ncAll, color: 'text-secondary', bg: 'bg-secondary/10' },
          ].map(card => (
            <div key={card.label} className={`glass-card p-5 ${card.bg}`}>
              <p className="text-zinc-400 text-sm">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>฿{fmt(card.value)}</p>
              {totalAll > 0 && card.value !== totalAll && (
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-current opacity-60 transition-all"
                    style={{ width: `${(card.value / totalAll) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-zinc-400">ยังไม่มีข้อมูล — ลอง Import ข้อมูลก่อนนะครับ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((group) => {
              const filteredItems = filterCode === 'ALL'
                ? group.items
                : group.items.filter(i => i.paymentCode === filterCode);
              const isExpanded = expandedCard === group.cardName;

              return (
                <div key={group.cardName} className="glass-card overflow-hidden">
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : group.cardName)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white text-lg">💳</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-zinc-100">{group.cardName}</p>
                        <p className="text-zinc-400 text-sm">{group.items.length} รายการ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-zinc-400 text-xs">PK / NC</p>
                        <p className="text-sm">
                          <span className="text-primary font-medium">฿{fmt(group.pkTotal)}</span>
                          <span className="text-zinc-500 mx-1">/</span>
                          <span className="text-secondary font-medium">฿{fmt(group.ncTotal)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400 text-xs">รวม</p>
                        <p className="text-zinc-100 font-bold text-lg">฿{fmt(group.totalAmount)}</p>
                      </div>
                      <span className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </button>

                  {/* Expanded Table */}
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {filteredItems.length === 0 ? (
                        <p className="text-center text-zinc-500 py-6">ไม่มีรายการ {filterCode === 'P' ? 'Personal' : 'Shared'}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-white/3">
                              <tr>
                                {['วันที่', 'รายการ', 'งวด', 'Due Date', 'Code', 'Total', 'PK', 'NC'].map(h => (
                                  <th key={h} className="text-left py-2.5 px-4 text-zinc-400 font-medium whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.map((item) => (
                                <tr key={item.id} className={`border-t border-white/5 hover:bg-white/3 transition-colors
                                  ${isDueSoon(item.dueDate) ? 'bg-danger/5' : ''}`}>
                                  <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">{fmtDate(item.date)}</td>
                                  <td className="py-2.5 px-4 text-zinc-200 max-w-[180px]">
                                    <div className="truncate" title={item.title}>{item.title}</div>
                                    {item.paymentApp && <div className="text-zinc-500 text-xs">{item.paymentApp}</div>}
                                  </td>
                                  <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                                    {item.installmentTotal > 0
                                      ? `${String(item.installmentCurrent).padStart(3,'0')}/${String(item.installmentTotal).padStart(3,'0')}`
                                      : <span className="text-zinc-600">-</span>}
                                  </td>
                                  <td className={`py-2.5 px-4 whitespace-nowrap ${isDueSoon(item.dueDate) ? 'text-danger font-medium' : 'text-zinc-400'}`}>
                                    {fmtDate(item.dueDate)}
                                    {isDueSoon(item.dueDate) && <span className="ml-1 text-xs">🔴</span>}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold
                                      ${item.paymentCode === 'P' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                                      {item.paymentCode}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-zinc-200 text-right font-medium whitespace-nowrap">
                                    ฿{fmt(item.totalAmount)}
                                  </td>
                                  <td className="py-2.5 px-4 text-primary text-right whitespace-nowrap">
                                    {item.pkAmount > 0 ? `฿${fmt(item.pkAmount)}` : <span className="text-zinc-600">-</span>}
                                  </td>
                                  <td className="py-2.5 px-4 text-secondary text-right whitespace-nowrap">
                                    {item.ncAmount > 0 ? `฿${fmt(item.ncAmount)}` : <span className="text-zinc-600">-</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            {/* Sub-total row */}
                            <tfoot className="bg-white/5">
                              <tr>
                                <td colSpan={5} className="py-2.5 px-4 text-zinc-400 font-medium">รวม</td>
                                <td className="py-2.5 px-4 text-zinc-100 text-right font-bold">
                                  ฿{fmt(filteredItems.reduce((s, i) => s + i.totalAmount, 0))}
                                </td>
                                <td className="py-2.5 px-4 text-primary text-right font-bold">
                                  ฿{fmt(filteredItems.reduce((s, i) => s + i.pkAmount, 0))}
                                </td>
                                <td className="py-2.5 px-4 text-secondary text-right font-bold">
                                  ฿{fmt(filteredItems.reduce((s, i) => s + i.ncAmount, 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
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
