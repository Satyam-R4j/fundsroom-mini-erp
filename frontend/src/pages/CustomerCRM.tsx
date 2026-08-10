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
    <div className="flex flex-col gap-6">
      {/* Header & Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Users className="text-blue-500" size={26} /> Customer CRM Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Track sales leads, customer contacts, follow-up dates, and activity logs.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setIsAddModalOpen(true);
          }}
          className="btn-primary py-2.5 px-4 flex items-center gap-2 text-sm"
        >
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card p-4 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, business, email or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm text-slate-400 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Customer & Business</th>
                <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Follow-up Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customer records found matching filter criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{c.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building size={13} className="text-slate-500" /> {c.businessName} {c.gstNumber && `(${c.gstNumber})`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 flex items-center gap-1.5">
                        <Phone size={13} className="text-blue-400" /> {c.mobile}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail size={13} className="text-slate-500" /> {c.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        c.customerType === 'DISTRIBUTOR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        c.customerType === 'WHOLESALE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.status === 'ACTIVE' ? 'badge-active' :
                        c.status === 'LEAD' ? 'badge-lead' : 'badge-inactive'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.followUpDate ? (
                        <span className="flex items-center gap-1.5 text-amber-400 font-medium text-xs">
                          <Calendar size={14} /> {new Date(c.followUpDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">None set</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(c.id)}
                          className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1.5"
                          title="View detail page and notes timeline"
                        >
                          <Eye size={14} /> Notes ({c._count?.followUpLogs || 0})
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn-secondary py-1.5 px-2.5 text-xs"
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
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-slate-100">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="e.g. 27AAACA12341Z5"
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer Type</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-4 text-sm">
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer & Follow-up History */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-xl bg-slate-900 h-full overflow-y-auto p-6 border-l border-slate-800 flex flex-col gap-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-extrabold text-slate-100">{selectedCustomer.name}</h3>
                <p className="text-blue-400 text-sm font-semibold mt-0.5">{selectedCustomer.businessName}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-200">
                <X size={22} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Type</span>
                <span className="font-bold text-slate-200">{selectedCustomer.customerType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedCustomer.status === 'ACTIVE' ? 'badge-active' :
                  selectedCustomer.status === 'LEAD' ? 'badge-lead' : 'badge-inactive'
                }`}>{selectedCustomer.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Mobile</span>
                <span className="font-semibold text-slate-300">{selectedCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">GST #</span>
                <span className="font-semibold text-slate-300">{selectedCustomer.gstNumber || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <MapPin size={14} className="text-slate-500" /> Address
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedCustomer.address}</p>
            </div>

            {/* Add Follow-up Note Form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" /> Add Follow-up Activity Note
              </h4>
              <form onSubmit={handleAddNote} className="flex flex-col gap-3">
                <textarea
                  rows={2}
                  required
                  placeholder="Record client discussion, quotation updates, or call summary..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="btn-primary self-end py-1.5 px-3 text-xs flex items-center gap-1.5"
                >
                  <Send size={14} /> {submittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </form>
            </div>

            {/* Follow-up Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Follow-up History Timeline ({selectedCustomer.followUpLogs?.length || 0})
              </h4>
              <div className="flex flex-col gap-3">
                {!selectedCustomer.followUpLogs || selectedCustomer.followUpLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No activity notes recorded yet.</p>
                ) : (
                  selectedCustomer.followUpLogs.map((log) => (
                    <div key={log.id} className="bg-slate-950 p-3.5 rounded-xl border-l-4 border-blue-500 border border-slate-800">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-bold text-blue-400">{log.author.name} ({log.author.role})</span>
                        <span className="text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-normal">{log.note}</p>
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
