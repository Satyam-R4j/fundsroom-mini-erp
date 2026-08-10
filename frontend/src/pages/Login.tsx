import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, UserCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Submit credentials to backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick preset loader for test demonstration
  const handleQuickLogin = (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      ADMIN: 'admin@fundsroom.com',
      SALES: 'sales@fundsroom.com',
      WAREHOUSE: 'warehouse@fundsroom.com',
      ACCOUNTS: 'accounts@fundsroom.com',
    };
    setEmail(roleEmailMap[role]);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 shadow-xl shadow-blue-500/20 mb-4">
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Fundsroom Mini ERP
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Role-Based CRM & Operations Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 mb-6">
            Sign In to Account
          </h2>

          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@fundsroom.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <UserCheck size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Login Helper for Evaluation */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
              Quick Test Credentials (Click to load):
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-blue-400 text-xs font-semibold transition-all hover:bg-slate-900 text-left"
              >
                🛡️ Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('SALES')}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 text-xs font-semibold transition-all hover:bg-slate-900 text-left"
              >
                💼 Sales
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('WAREHOUSE')}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-400 text-xs font-semibold transition-all hover:bg-slate-900 text-left"
              >
                📦 Warehouse
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ACCOUNTS')}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-purple-400 text-xs font-semibold transition-all hover:bg-slate-900 text-left"
              >
                📊 Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
