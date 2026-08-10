import React from 'react';
import { Layers, ShieldCheck, Database, Rocket } from 'lucide-react';

function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex' }}>
            <Layers size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Fundsroom ERP</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mini ERP + CRM Operations Portal</p>
          </div>
        </div>
        <span className="badge badge-active">System Ready</span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}><ShieldCheck size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>1. Auth & Roles</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Role-based access for Admin, Sales, Warehouse, and Accounts.</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--success)', marginBottom: '1rem' }}><Layers size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>2. Customer CRM</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage leads, clients, follow-up dates & history notes.</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--warning)', marginBottom: '1rem' }}><Database size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>3. Product Inventory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Stock alerts, minimum levels & automatic IN/OUT logs.</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}><Rocket size={32} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>4. Sales Challans</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Auto challan numbers, snapshot pricing & atomic stock deduction.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
