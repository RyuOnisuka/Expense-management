import { useEffect, useState } from 'react';
import { Users, CheckCircle, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface Settlement {
  id: number;
  fromUserId: number;
  toUserId: number;
  amount: string;
  isPaid: boolean;
  fromUser: { name: string; avatarUrl: string };
  toUser: { name: string; avatarUrl: string };
}

export default function Settlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function fetchSettlements() {
    try {
      setLoading(true);
      const res = await axios.get('/api/settlements');
      setSettlements(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError('Could not fetch settlements from backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettlements();
  }, []);

  const markAsPaid = async (id: number) => {
    try {
      await axios.post(`/api/settlements/${id}/pay`);
      // Update state locally
      setSettlements(settlements.map(s => s.id === id ? { ...s, isPaid: true } : s));
    } catch (err) {
      console.error('Error settling payment:', err);
      alert('Failed to update settlement. Make sure backend is running.');
    }
  };

  const copySummary = (s: Settlement) => {
    const text = `💸 *FlowManager Collection Summary* 💸\n-----------------------------------\n👤 *Spender:* ${s.toUser.name}\n👤 *Debtor:* ${s.fromUser.name}\n💰 *Amount Owed:* ฿${parseFloat(s.amount).toFixed(2)}\n📝 *Status:* ${s.isPaid ? 'Paid' : 'Unpaid (Pending Settlement)'}\n\nPlease transfer using promptpay/bank transfer and send the slip. Thanks!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group active settlements to show "Spender Collection" vs "Debtor Owed"
  const activeSettlements = settlements.filter(s => !s.isPaid);
  const settledPayments = settlements.filter(s => s.isPaid);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settlements</h1>
          <p className="text-zinc-400">Track and settle outstanding balances between group members.</p>
        </div>
        <button onClick={fetchSettlements} className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 text-danger">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active / Pending Settlements */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Pending Payments</h2>
              
              {activeSettlements.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
                  <p className="text-zinc-500">All balances are settled! Awesome job! 🥳</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSettlements.map((s) => (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={s.fromUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                            alt={s.fromUser.name} 
                            className="w-10 h-10 rounded-full border border-white/10"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-warning rounded-full border-2 border-[#09090b]"></span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            <span className="text-warning">{s.fromUser.name}</span> owes <span className="text-primary">{s.toUser.name}</span>
                          </p>
                          <p className="text-sm text-zinc-400">Pending settlement</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span className="text-lg font-bold text-white pr-2">
                          ฿{parseFloat(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => copySummary(s)} 
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors border border-white/5 flex items-center gap-1.5 text-xs font-medium"
                            title="Copy Settlement Summary"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedId === s.id ? 'Copied!' : 'Copy Info'}
                          </button>
                          
                          <button 
                            onClick={() => markAsPaid(s.id)} 
                            className="p-2 bg-success/20 hover:bg-success/30 text-success rounded-lg transition-colors border border-success/20 flex items-center gap-1.5 text-xs font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Paid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settled / Paid History */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recently Settled</h2>
              
              {settledPayments.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">No payment history yet.</p>
              ) : (
                <div className="space-y-3">
                  {settledPayments.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 opacity-70">
                      <div className="flex items-center gap-3">
                        <img 
                          src={s.fromUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          alt={s.fromUser.name} 
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">
                            {s.fromUser.name} → {s.toUser.name}
                          </p>
                          <span className="text-xs text-success bg-success/15 px-1.5 py-0.5 rounded-md font-medium">Settled</span>
                        </div>
                      </div>
                      <span className="font-semibold text-zinc-300">
                        ฿{parseFloat(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
