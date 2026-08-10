import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  MessageSquare,
  X,
  Phone,
  Mail,
  Building,
  FileText,
  Calendar,
  Send,
  MapPin,
} from 'lucide-react';

export interface CustomerNote {
  id: string;
  note: string;
  createdAt: string;
  author: {
    name: string;
    email: string;
    role: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string;
  notes?: string;
  updatedAt: string;
  _count?: { followUpLogs: number };
  followUpLogs?: CustomerNote[];
}

export const CustomerCRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Note State
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);

  // Customer Form Data
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, customerType: typeFilter, status: statusFilter },
      });
      setCustomers(res.data.customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  // Open Edit Modal with populated fields
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
      notes: c.notes || '',
    });
  };

  // Open Customer Detail Drawer & load full follow-up history
  const handleOpenDetail = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data.customer);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  // Submit Add or Edit Customer
  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setIsAddModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save customer record.');
    }
  };

  // Add follow-up note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await api.post(`/customers/${selectedCustomer.id}/notes`, {
        note: newNoteText,
      });

      // Append new note to active drawer view
      setSelectedCustomer({
        ...selectedCustomer,
        followUpLogs: [res.data.note, ...(selectedCustomer.followUpLogs || [])],
      });
      setNewNoteText('');
      fetchCustomers(); // Refresh list log counts
    } catch (err) {
      console.error('Failed to log note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users color="#3b82f6" /> Customer CRM Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Track sales leads, customer contacts, follow-up dates, and activity logs.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setIsAddModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, business, email or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="glass-panel" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Customer & Business</th>
              <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Follow-up Date</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Loading customer records...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No customer records found matching filter criteria.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building size={13} /> {c.businessName} {c.gstNumber && `(${c.gstNumber})`}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} color="#60a5fa" /> {c.mobile}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={13} color="#64748b" /> {c.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      background: c.customerType === 'DISTRIBUTOR' ? 'rgba(139, 92, 246, 0.2)' : c.customerType === 'WHOLESALE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      color: c.customerType === 'DISTRIBUTOR' ? '#c084fc' : c.customerType === 'WHOLESALE' ? '#60a5fa' : '#cbd5e1'
                    }}>
                      {c.customerType}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: c.followUpDate ? '#fbbf24' : '#64748b' }}>
                    {c.followUpDate ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <Calendar size={14} /> {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                    ) : (
                      'None set'
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        title="View detail page and notes timeline"
                      >
                        <Eye size={14} /> Notes ({c._count?.followUpLogs || 0})
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        title="Edit Customer Details"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', borderRadius: '1rem', padding: '1.5rem', background: '#1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="e.g. 27AAACA12341Z5"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Customer Type</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer & Follow-up History */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#1e293b',
            height: '100%',
            overflowY: 'auto',
            padding: '1.5rem',
            borderLeft: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>{selectedCustomer.name}</h3>
                <p style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>{selectedCustomer.businessName}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#0f172a', padding: '1rem', borderRadius: '0.6rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Type</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedCustomer.customerType}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Status</span>
                <span className={`badge badge-${selectedCustomer.status.toLowerCase()}`}>{selectedCustomer.status}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Mobile</span>
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedCustomer.mobile}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>GST #</span>
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedCustomer.gstNumber || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <MapPin size={14} /> Address
              </span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedCustomer.address}</p>
            </div>

            {/* Add Follow-up Note Form */}
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} color="#3b82f6" /> Add Follow-up Activity Note
              </h4>
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <textarea
                  rows={2}
                  required
                  placeholder="Record client discussion, quotation updates, or call summary..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '0.4rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <Send size={14} /> {submittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </form>
            </div>

            {/* Follow-up Timeline */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#94a3b8' }}>
                Follow-up History Timeline ({selectedCustomer.followUpLogs?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!selectedCustomer.followUpLogs || selectedCustomer.followUpLogs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>No activity notes recorded yet.</p>
                ) : (
                  selectedCustomer.followUpLogs.map((log) => (
                    <div key={log.id} style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '0.6rem', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: '#60a5fa' }}>{log.author.name} ({log.author.role})</span>
                        <span style={{ color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{log.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
