import { useState } from 'react';
import { Home, CreditCard, Receipt, Users, Menu, X, DollarSign, Upload, BarChart3, Calendar } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SplitExpense from './pages/SplitExpense';
import Settlements from './pages/Settlements';
import Cards from './pages/Cards';
import ImportPage from './pages/Import';
import CardSummary from './pages/CardSummary';
import Installments from './pages/Installments';

type TabId = 'dashboard' | 'cards' | 'expenses' | 'settlements' | 'import' | 'card-summary' | 'installments';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const navigation: { name: string; id: TabId; icon: any; badge?: string; divider?: boolean }[] = [
    { name: 'Dashboard', id: 'dashboard', icon: Home },
    { name: 'บัตรเครดิต', id: 'cards', icon: CreditCard },
    { name: 'บันทึกค่าใช้จ่าย', id: 'expenses', icon: Receipt },
    { name: 'Settlements', id: 'settlements', icon: Users },
    { name: 'สรุปยอดบัตร', id: 'card-summary', icon: BarChart3, divider: true },
    { name: 'ติดตามผ่อนชำระ', id: 'installments', icon: Calendar },
    { name: 'นำเข้าข้อมูล', id: 'import', icon: Upload },
  ];

  const handleNav = (id: TabId) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    // Also patch the card-summary link from Dashboard
    if (id === 'card-summary') {
      window.location.hash = '#/card-summary';
    }
  };

  // Handle hash navigation from Dashboard link
  if (window.location.hash === '#/card-summary' && activeTab !== 'card-summary') {
    setActiveTab('card-summary');
    window.location.hash = '';
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">FlowManager</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-surface border-r border-white/5 flex flex-col transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300`}>
        
        {/* Logo */}
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-white/5">
          <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl shadow-lg shadow-primary/30">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-wide block">FlowManager</span>
            <span className="text-xs text-zinc-500">Expense Management</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 mt-4 md:mt-0 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id}>
                {item.divider && (
                  <div className="border-t border-white/5 my-3" />
                )}
                <button
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                    ${isActive
                      ? 'bg-gradient-to-r from-primary/20 to-secondary/10 text-primary font-medium border border-primary/20'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                >
                  <Icon className={`w-5 h-5 flex-none ${isActive ? 'text-primary' : ''}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* User info footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/30 border-2 border-surface flex items-center justify-center text-xs font-bold text-primary">PK</div>
              <div className="w-8 h-8 rounded-full bg-secondary/30 border-2 border-surface flex items-center justify-center text-xs font-bold text-secondary">NC</div>
            </div>
            <div>
              <p className="text-zinc-300 text-sm font-medium">Golf & Nink</p>
              <p className="text-zinc-500 text-xs">PK / NC</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'cards' && <Cards />}
          {activeTab === 'expenses' && <SplitExpense />}
          {activeTab === 'settlements' && <Settlements />}
          {activeTab === 'import' && <ImportPage />}
          {activeTab === 'card-summary' && <CardSummary />}
          {activeTab === 'installments' && <Installments />}
        </div>
      </main>
    </div>
  );
}
