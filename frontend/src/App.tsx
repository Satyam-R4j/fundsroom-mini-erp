import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { CustomerCRM } from './pages/CustomerCRM';
import { Inventory } from './pages/Inventory';
import { SalesChallans } from './pages/SalesChallans';
import { Dashboard } from './pages/Dashboard';
import {
  Layers,
  ShieldCheck,
  Database,
  Rocket,
  LogOut,
  User as UserIcon,
  Users,
  LayoutDashboard,
  PackageCheck,
  FileText,
} from 'lucide-react';

type ActiveTab = 'DASHBOARD' | 'CRM' | 'INVENTORY' | 'CHALLANS';

const MainContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('CRM');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading session context...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const roleBadgeStyle: Record<string, string> = {
    ADMIN: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    SALES: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    WAREHOUSE: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    ACCOUNTS: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top Navbar Header */}
      <header className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-600/30">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Fundsroom ERP</h1>
            <p className="text-xs text-slate-400">Operations & CRM Portal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={15} /> Overview
          </button>

          <button
            onClick={() => setActiveTab('CRM')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'CRM' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} /> Customer CRM
          </button>

          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'INVENTORY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck size={15} /> Inventory
          </button>

          <button
            onClick={() => setActiveTab('CHALLANS')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'CHALLANS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={15} /> Sales Challans
          </button>
        </nav>

        {/* Logged in User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <UserIcon size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-200">{user.name}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${roleBadgeStyle[user.role]}`}>
              {user.role}
            </span>
          </div>

          <button onClick={logout} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      {/* Main Tab View Switcher */}
      {activeTab === 'CRM' && <CustomerCRM />}

      {activeTab === 'DASHBOARD' && (
        <Dashboard onNavigateTab={(tab) => setActiveTab(tab)} />
      )}

      {activeTab === 'INVENTORY' && <Inventory />}

      {activeTab === 'CHALLANS' && <SalesChallans />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
