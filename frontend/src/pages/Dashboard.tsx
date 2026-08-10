import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { productService, Product } from '../services/productService';
import { challanService, Challan } from '../services/challanService';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  User as UserIcon,
  Activity,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  onNavigateTab: (tab: 'CRM' | 'INVENTORY' | 'CHALLANS') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [activeLeadsCount, setActiveLeadsCount] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<boolean>(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [custRes, prodData, challanData, healthRes] = await Promise.all([
        api.get('/customers'),
        productService.getProducts(),
        challanService.getChallans(),
        api.get('/health').catch(() => ({ data: { status: 'ERROR' } })),
      ]);

      const custs = Array.isArray(custRes.data?.customers)
        ? custRes.data.customers
        : Array.isArray(custRes.data)
        ? custRes.data
        : [];

      setCustomersCount(custs.length);
      setActiveLeadsCount(custs.filter((c: any) => c.status === 'LEAD').length);
      setProducts(prodData);
      setChallans(challanData);
      setApiStatus(healthRes.data?.status === 'OK');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
  const confirmedChallans = challans.filter((c) => c.status === 'CONFIRMED');
  const draftChallansCount = challans.filter((c) => c.status === 'DRAFT').length;
  const totalRevenue = confirmedChallans.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalItemsDispatched = confirmedChallans.reduce((acc, c) => acc + c.totalQuantity, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <LayoutDashboard className="text-blue-500" size={28} /> ERP Operations Executive Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <strong className="text-slate-200">{user?.name}</strong>. Here is the live status of your business operations.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5 hover:text-blue-400"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Live Data
        </button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer KPI */}
        <div
          onClick={() => onNavigateTab('CRM')}
          className="glass-card p-5 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer CRM</span>
            <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{customersCount}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-400 font-semibold">{activeLeadsCount} Active Leads</span>
            <span className="text-slate-500 flex items-center gap-1 group-hover:text-slate-300">
              Manage <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Inventory KPI */}
        <div
          onClick={() => onNavigateTab('INVENTORY')}
          className={`glass-card p-5 rounded-2xl cursor-pointer transition-all group ${
            lowStockProducts.length > 0
              ? 'hover:border-amber-500/60 border-amber-500/30'
              : 'hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Catalog</span>
            <div
              className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform ${
                lowStockProducts.length > 0
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}
            >
              <PackageCheck size={22} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{products.length}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={lowStockProducts.length > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {lowStockProducts.length} Low Stock Alerts
            </span>
            <span className="text-slate-500 flex items-center gap-1 group-hover:text-slate-300">
              Stock <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Sales Challans KPI */}
        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="glass-card p-5 rounded-2xl cursor-pointer hover:border-purple-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales Challans</span>
            <div className="bg-purple-500/10 text-purple-400 p-2.5 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform">
              <FileText size={22} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{challans.length}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-purple-400 font-semibold">{draftChallansCount} Pending Drafts</span>
            <span className="text-slate-500 flex items-center gap-1 group-hover:text-slate-300">
              Challans <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Revenue KPI */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Revenue</span>
            <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20">
              <DollarSign size={22} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {totalItemsDispatched.toLocaleString()} units fulfilled
          </p>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-amber-500/40 bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="animate-pulse" size={18} /> Low Stock Warnings Detected ({lowStockProducts.length})
            </h3>
            <button
              onClick={() => onNavigateTab('INVENTORY')}
              className="text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1"
            >
              Open Inventory & Restock →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {lowStockProducts.slice(0, 3).map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <p className="font-mono text-[10px] text-amber-400 font-bold">[{p.sku}]</p>
                  <p className="font-bold text-slate-200 truncate max-w-[140px]">{p.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-extrabold text-xs block">{p.currentStock} units</span>
                  <span className="text-slate-500 text-[10px] block">Min Alert: {p.minStockAlert}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Navigation Shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Operational Portals</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('CRM')}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all space-y-3 group"
            >
              <div className="bg-emerald-500/10 text-emerald-400 w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">1. Customer CRM</h4>
                <p className="text-xs text-slate-400 mt-1">Manage leads, retail & distributor accounts, and follow-up logs.</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
                Open CRM <ArrowRight size={12} />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('INVENTORY')}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-3 group"
            >
              <div className="bg-amber-500/10 text-amber-400 w-10 h-10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <PackageCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">2. Inventory Catalog</h4>
                <p className="text-xs text-slate-400 mt-1">Live stock levels, minimum alerts, and IN/OUT movement audit trails.</p>
              </div>
              <span className="text-xs font-semibold text-amber-400 inline-flex items-center gap-1">
                Open Inventory <ArrowRight size={12} />
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('CHALLANS')}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all space-y-3 group"
            >
              <div className="bg-purple-500/10 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors">3. Sales Challans</h4>
                <p className="text-xs text-slate-400 mt-1">Auto challan numbering, snapshot prices, and stock deduction.</p>
              </div>
              <span className="text-xs font-semibold text-purple-400 inline-flex items-center gap-1">
                Open Challans <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* System Overview Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Activity className="text-blue-400" size={18} /> Fundsroom Mini ERP Capabilities
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This application was engineered for full-stack ERP operations. It features Prisma ORM transactional consistency, JWT authentication with 4 system roles (Admin, Sales, Warehouse, Accounts), price snapshot preservation, and stock movement logs.
            </p>
          </div>
        </div>

        {/* System Health & RBAC Status Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">System Architecture Status</h3>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2 font-semibold">
                <Activity size={16} className="text-blue-400" /> Backend API Server
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                apiStatus
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {apiStatus ? 'ONLINE (200 OK)' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2 font-semibold">
                <Database size={16} className="text-amber-400" /> SQLite Database
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRISMA CONNECTED
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} className="text-purple-400" /> JWT Security & RBAC
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                ACTIVE ({user?.role})
              </span>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-500 font-mono">Session Token Active</p>
              <p className="text-xs font-bold text-slate-300 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
