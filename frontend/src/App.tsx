import { useState } from 'react';
import { Home, CreditCard, Receipt, Users, Menu, X, DollarSign } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SplitExpense from './pages/SplitExpense';
import Settlements from './pages/Settlements';
import Cards from './pages/Cards';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cards' | 'expenses' | 'settlements'>('dashboard');

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: Home },
    { name: 'Cards', id: 'cards', icon: CreditCard },
    { name: 'Split Expense', id: 'expenses', icon: Receipt },
    { name: 'Settlements', id: 'settlements', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">FlowManager</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-10 w-64 bg-surface border-r border-white/5 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-white tracking-wide">FlowManager</span>
        </div>

        <nav className="p-4 space-y-2 mt-4 md:mt-0">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'cards' && <Cards />}
          {activeTab === 'expenses' && <SplitExpense />}
          {activeTab === 'settlements' && <Settlements />}
        </div>
      </main>
    </div>
  );
}
