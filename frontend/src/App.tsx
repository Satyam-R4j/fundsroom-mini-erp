import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layers, ShieldCheck, Database, Rocket, LogOut, User as UserIcon } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading session context...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render role badge colors
  const roleBadgeStyle: Record<string, { bg: string; color: string }> = {
    ADMIN: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
    SALES: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
    WAREHOUSE: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
    ACCOUNTS: { bg: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' },
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Navbar Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2.5rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '1rem',
        background: '#1e293b',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex' }}>
            <Layers size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Fundsroom ERP</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operations & CRM Portal</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: '1px solid #334155' }}>
            <UserIcon size={16} color="#94a3b8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
            <span
              className="badge"
              style={{
                background: roleBadgeStyle[user.role]?.bg,
                color: roleBadgeStyle[user.role]?.color,
                marginLeft: '0.4rem'
              }}
            >
              {user.role}
            </span>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Module Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><ShieldCheck size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>1. Auth & Roles</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Logged in as <strong>{user.name}</strong> ({user.role}). RBAC middleware active.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--success)', marginBottom: '1rem' }}><Layers size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>2. Customer CRM</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Customer leads, contacts, follow-up timeline & notes logger.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--warning)', marginBottom: '1rem' }}><Database size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>3. Inventory Module</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Stock tracking, minimum alert thresholds & movement log history.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}><Rocket size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>4. Sales Challans</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Auto-generated challan numbers, snapshot pricing & atomic stock logic.
          </p>
        </div>
      </div>
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
