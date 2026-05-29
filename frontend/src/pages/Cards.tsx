import { useEffect, useState } from 'react';
import { CreditCard as CardIcon, Plus, Trash2, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface Card {
  id: number;
  name: string;
  statementCycleDay: number;
  dueDateDay: number;
}

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [statementDay, setStatementDay] = useState(25);
  const [dueDay, setDueDay] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchCards() {
    try {
      setLoading(true);
      const res = await axios.get('/api/cards');
      setCards(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Could not connect to the backend server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCards();
  }, []);

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/cards', {
        name,
        statementCycleDay: statementDay,
        dueDateDay: dueDay,
      });
      setCards([...cards, res.data]);
      setName('');
      setStatementDay(25);
      setDueDay(5);
    } catch (err) {
      console.error('Error adding card:', err);
      alert('Failed to add credit card profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCard = async (id: number) => {
    if (!confirm('Are you sure you want to delete this card profile?')) return;

    try {
      await axios.delete(`/api/cards/${id}`);
      setCards(cards.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Failed to delete card profile.');
    }
  };

  // Card color maps based on card name/index for a vibrant UI
  const getCardStyle = (index: number) => {
    const gradients = [
      'from-purple-600 to-indigo-600',
      'from-blue-600 to-cyan-500',
      'from-rose-600 to-orange-500',
      'from-emerald-600 to-teal-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Credit Card Profiles</h1>
          <p className="text-zinc-400">Manage billing statements, payment cycles, and tracking due dates.</p>
        </div>
        <button onClick={fetchCards} className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5">
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3 text-danger">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Card List / Grid */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5 border-dashed">
              <CardIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No cards added yet.</p>
              <p className="text-zinc-500 text-sm mt-1">Use the form to add your statement cycles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card, index) => (
                <div key={card.id} className="relative group overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  {/* Card design */}
                  <div className={`p-6 bg-gradient-to-br ${getCardStyle(index)} relative flex flex-col justify-between h-44 shadow-lg shadow-black/25`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Card Profile</span>
                        <h3 className="text-xl font-bold text-white tracking-wide">{card.name}</h3>
                      </div>
                      <div className="bg-white/15 p-2.5 rounded-xl text-white backdrop-blur-md">
                        <CardIcon className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/15">
                      <div>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Statement Cycle</span>
                        <span className="text-sm font-semibold text-white">Every {card.statementCycleDay}th</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Payment Due</span>
                        <span className="text-sm font-semibold text-white">Every {card.dueDateDay}th</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Delete Action */}
                  <button 
                    onClick={() => deleteCard(card.id)}
                    className="absolute top-4 right-4 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl shadow-lg border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Credit Card Form */}
        <div className="glass-card p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-6">Add Card Profile</h2>
          
          <form onSubmit={addCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Card Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                placeholder="e.g. Citi Cash Back"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Statement Day
                </label>
                <select
                  value={statementDay}
                  onChange={(e) => setStatementDay(parseInt(e.target.value))}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Due Date Day
                </label>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value))}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Adding...' : 'Add Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
