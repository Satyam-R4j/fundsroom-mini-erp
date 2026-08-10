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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
            marginBottom: '1rem'
          }}>
            <Shield size={36} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Fundsroom Mini ERP
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Role-Based CRM & Operations Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f8fafc' }}>
            Sign In to Account
          </h2>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.6rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="name@fundsroom.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <UserCheck size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <KeyRound size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.8rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Login Helper for Evaluation */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Quick Test Credentials (Click to load):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#60a5fa',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                🛡️ Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('SALES')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#34d399',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                💼 Sales
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('WAREHOUSE')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fbbf24',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                📦 Warehouse
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ACCOUNTS')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#c084fc',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
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
