import { useState, useMemo, useEffect } from 'react';
import { Camera, Plus, Trash2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';

interface LineItem {
  id: string;
  name: string;
  price: number;
  assignee: 'unassigned' | 'personal' | 'shared' | 'alex' | 'mark' | 'sarah';
}

interface Card {
  id: number;
  name: string;
}

export default function SplitExpense() {
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountTax, setDiscountTax] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [title, setTitle] = useState('New Expense');
  const [selectedCardId, setSelectedCardId] = useState<string>('cash');
  const [cards, setCards] = useState<Card[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch available cards for the dropdown
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await axios.get('/api/cards');
        setCards(res.data);
      } catch (err) {
        console.error('Error fetching cards for dropdown:', err);
      }
    }
    fetchCards();
  }, []);

  const simulateOCR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setItems([
        { id: '1', name: 'Wagyu Beef Steak', price: 1200, assignee: 'unassigned' },
        { id: '2', name: 'Truffle Fries', price: 250, assignee: 'shared' },
        { id: '3', name: 'Craft Beer (Pint)', price: 300, assignee: 'mark' },
        { id: '4', name: 'Sparkling Water', price: 120, assignee: 'alex' },
        { id: '5', name: 'Chocolate Lime Tart', price: 280, assignee: 'sarah' },
      ]);
      setDiscountTax(215); // Service Charge + VAT
      setTitle('Steakhouse Dinner');
      setIsScanning(false);
    }, 1500);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: 'New Item', price: 0, assignee: 'unassigned' }]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculations
  const subTotal = useMemo(() => items.reduce((acc, item) => acc + item.price, 0), [items]);
  const total = subTotal + discountTax;

  // Proportional split math
  const getProportionalShare = (assignee: string) => {
    const rawSum = items
      .filter(i => {
        if (assignee === 'shared' && i.assignee === 'shared') return true;
        if (i.assignee === assignee) return true;
        return false;
      })
      .reduce((acc, item) => acc + (assignee === 'shared' ? item.price : item.assignee === 'shared' ? item.price / 3 : item.price), 0);
    
    const ratio = subTotal > 0 ? rawSum / subTotal : 0;
    const taxShare = discountTax * ratio;

    return rawSum + taxShare;
  };

  // Save the complete expense to the Express backend database
  const saveAndSplit = async () => {
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one line item.' });
      return;
    }

    if (items.some(item => item.assignee === 'unassigned')) {
      setMessage({ type: 'error', text: 'Please assign all items before splitting.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const payload = {
        title,
        totalAmount: total,
        creditCardId: selectedCardId === 'cash' ? null : parseInt(selectedCardId),
        discountTax,
        items: items.map(i => ({
          name: i.name,
          price: i.price,
          assignee: i.assignee
        }))
      };

      await axios.post('/api/expenses', payload);

      setMessage({ type: 'success', text: 'Expense successfully saved and split! Settlements distributed.' });
      // Reset form
      setItems([]);
      setDiscountTax(0);
      setTitle('New Expense');
      setSelectedCardId('cash');
    } catch (err: any) {
      console.error('Error saving split expense:', err);
      setMessage({ type: 'error', text: 'Failed to save expense. Make sure the backend server is running.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Split an Expense</h1>
          <p className="text-zinc-400">Scan a receipt or enter items manually.</p>
        </div>
        <button 
          onClick={simulateOCR}
          disabled={isScanning}
          className="btn-primary flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
          {isScanning ? 'Scanning...' : 'Scan Receipt (AI OCR)'}
        </button>
      </header>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-success/10 border-success/20 text-success' 
            : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Expense Title</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            placeholder="e.g. Big C Grocery, Dinner"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Paid Using</label>
          <select 
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
          >
            <option value="cash">Cash (No card)</option>
            {cards.map(card => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Itemization List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Line Items</h2>
              <button onClick={addItem} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p className="text-zinc-500">No items yet. Scan a receipt or add manually.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex-1 flex gap-3">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="bg-transparent text-white border-b border-white/10 focus:border-primary focus:outline-none w-full pb-1"
                        placeholder="Item name"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">฿</span>
                        <input 
                          type="number" 
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="bg-transparent text-white border-b border-white/10 focus:border-primary focus:outline-none w-20 pb-1 text-right"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <select 
                        value={item.assignee}
                        onChange={(e) => updateItem(item.id, 'assignee', e.target.value)}
                        className="bg-surface border border-white/10 rounded-lg text-sm text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-primary"
                      >
                        <option value="unassigned">Unassigned</option>
                        <option value="personal">Personal (Alex)</option>
                        <option value="shared">Shared (All)</option>
                        <option value="mark">Mark</option>
                        <option value="sarah">Sarah</option>
                      </select>
                      
                      <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="glass-card p-6 flex items-center gap-4">
             <AlertCircle className="text-warning w-8 h-8 shrink-0" />
             <p className="text-zinc-300 text-sm">
               Make sure you assign all items. Items marked as "Shared" are divided equally among you, Mark, and Sarah. Tax and discounts are distributed proportionally.
             </p>
          </div>
        </div>

        {/* Master Summary card */}
        <div className="space-y-4">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Payment Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Subtotal</span>
                <span>฿{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2 text-zinc-400">
                <span className="flex-1">Tax / Service / Charge</span>
                <div className="flex items-center gap-1">
                  <span>฿</span>
                  <input 
                    type="number"
                    value={discountTax}
                    onChange={(e) => setDiscountTax(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white w-24 text-right focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="h-px bg-white/10 w-full my-2"></div>
              <div className="flex justify-between items-center text-xl font-bold text-white">
                <span>Total Bill</span>
                <span className="text-primary">฿{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-surface/50 rounded-xl p-4 border border-white/5 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 tracking-wide uppercase text-center">Settlement Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Personal (You)</span>
                  <span className="font-medium text-white">฿{getProportionalShare('personal').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Mark</span>
                  <span className="font-medium text-white">฿{getProportionalShare('mark').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-pink-400">Sarah</span>
                  <span className="font-medium text-white">฿{getProportionalShare('sarah').toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={saveAndSplit}
              disabled={isSaving}
              className="w-full btn-primary flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Save & Split Expense
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
