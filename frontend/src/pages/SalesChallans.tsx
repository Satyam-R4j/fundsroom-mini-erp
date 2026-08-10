import React, { useState, useEffect } from 'react';
import {
  challanService,
  Challan,
  CreateChallanPayload,
} from '../services/challanService';
import { api } from '../services/api';
import { productService, Product } from '../services/productService';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  DollarSign,
  Printer,
  Building,
  User as UserIcon,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Ban,
  Package,
} from 'lucide-react';

export interface CustomerOption {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  customerType: string;
  address: string;
  gstNumber?: string;
}

interface DraftLineItem {
  productId: string;
  quantity: number;
}

export const SalesChallans: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null);

  // Form Data for New Challan Creation
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([
    { productId: '', quantity: 1 },
  ]);

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all challans
  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await challanService.getChallans({
        q: searchQuery,
        status: selectedStatus,
      });
      setChallans(data);
    } catch (err: any) {
      console.error('Error fetching challans:', err);
      setError(err.response?.data?.message || 'Failed to load sales challans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchChallans();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedStatus]);

  // Load customer options and product catalog when modal opens
  const handleOpenCreateModal = async () => {
    try {
      setFormError(null);
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers'),
        productService.getProducts(),
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes);

      if (custRes.data.length > 0) {
        setSelectedCustomerId(custRes.data[0].id);
      }

      if (prodRes.length > 0) {
        setLineItems([{ productId: prodRes[0].id, quantity: 1 }]);
      } else {
        setLineItems([]);
      }

      setIsCreateModalOpen(true);
    } catch (err: any) {
      alert('Failed to load customer or product master data.');
    }
  };

  // Dynamic Line Item Handlers
  const handleAddLineItem = () => {
    const firstProdId = products.length > 0 ? products[0].id : '';
    setLineItems([...lineItems, { productId: firstProdId, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const handleLineItemChange = (index: number, field: keyof DraftLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? parseInt(value) || 1 : value,
    };
    setLineItems(updated);
  };

  // Submit New Challan
  const handleCreateChallanSubmit = async (status: 'DRAFT' | 'CONFIRMED') => {
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    if (lineItems.length === 0) {
      setFormError('Please add at least one line item product.');
      return;
    }

    // Check for unselected products or invalid quantities
    for (const item of lineItems) {
      if (!item.productId) {
        setFormError('All line items must have a selected product.');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        setFormError('Item quantity must be a positive number greater than 0.');
        return;
      }
    }

    setFormSubmitting(true);

    try {
      const payload: CreateChallanPayload = {
        customerId: selectedCustomerId,
        status,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await challanService.createChallan(payload);
      setIsCreateModalOpen(false);
      fetchChallans();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to generate Sales Challan.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update Challan Status (Confirm or Cancel)
  const handleUpdateStatus = async (challan: Challan, targetStatus: 'CONFIRMED' | 'CANCELLED') => {
    const confirmMsg =
      targetStatus === 'CONFIRMED'
        ? `Are you sure you want to CONFIRM challan ${challan.challanNumber}? This will deduct inventory stock automatically.`
        : `Are you sure you want to CANCEL challan ${challan.challanNumber}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await challanService.updateStatus(challan.id, targetStatus);
      fetchChallans();
      if (viewingChallan?.id === challan.id) {
        const updated = await challanService.getChallanById(challan.id);
        setViewingChallan(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update challan status.');
    }
  };

  // Calculation Helpers for Modal Form
  const productMap = new Map(products.map((p) => [p.id, p]));
  const calculatedTotalQuantity = lineItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const calculatedTotalAmount = lineItems.reduce((acc, item) => {
    const prod = productMap.get(item.productId);
    return acc + (prod ? prod.unitPrice * (item.quantity || 0) : 0);
  }, 0);

  // Metrics
  const totalChallansCount = challans.length;
  const draftCount = challans.filter((c) => c.status === 'DRAFT').length;
  const confirmedCount = challans.filter((c) => c.status === 'CONFIRMED').length;
  const totalConfirmedRevenue = challans
    .filter((c) => c.status === 'CONFIRMED')
    .reduce((acc, c) => acc + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <FileText className="text-purple-500" size={28} /> Sales Challans & Invoicing
          </h2>
          <p className="text-sm text-slate-400">
            Create sales challans, multi-product line items, price snapshots, and auto stock deduction.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-primary py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 bg-purple-600 hover:bg-purple-500 border-purple-500"
        >
          <Plus size={18} /> Create Sales Challan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/20">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Challans</p>
            <p className="text-2xl font-black text-slate-100">{totalChallansCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Drafts</p>
            <p className="text-2xl font-black text-amber-400">{draftCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Orders</p>
            <p className="text-2xl font-black text-emerald-400">{confirmedCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/20">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Value</p>
            <p className="text-xl font-black text-slate-100">
              ₹{totalConfirmedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by challan # or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-4 py-2 w-full text-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs w-full md:w-auto justify-end">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-400">Status Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Statuses</option>
            <option value="DRAFT" className="bg-slate-900">DRAFT Only</option>
            <option value="CONFIRMED" className="bg-slate-900">CONFIRMED Only</option>
            <option value="CANCELLED" className="bg-slate-900">CANCELLED Only</option>
          </select>
        </div>
      </div>

      {/* Sales Challan Table */}
      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-2xl">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading sales challans registry...
        </div>
      ) : error ? (
        <div className="glass-card p-6 rounded-2xl border border-red-500/30 text-red-400 text-center">
          <AlertCircle className="mx-auto mb-2" size={32} />
          {error}
        </div>
      ) : challans.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-2xl">
          <FileText size={48} className="mx-auto mb-3 text-slate-600" />
          <p className="text-lg font-semibold text-slate-300">No Sales Challans found.</p>
          <p className="text-xs text-slate-500 mt-1">Click "+ Create Sales Challan" to issue a new dispatch order.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold">Challan Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer Details</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Items / Qty</th>
                  <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {challans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      <span className="bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        {challan.challanNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-100">{challan.customer.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building size={12} /> {challan.customer.businessName}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(challan.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-300">
                      {challan._count?.items || challan.items.length} items ({challan.totalQuantity} pcs)
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-100">
                      ₹{challan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 w-fit border ${
                          challan.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : challan.status === 'DRAFT'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {challan.status === 'CONFIRMED' && <CheckCircle2 size={13} />}
                        {challan.status === 'DRAFT' && <Layers size={13} />}
                        {challan.status === 'CANCELLED' && <Ban size={13} />}
                        {challan.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingChallan(challan)}
                          className="btn-secondary py-1 px-2.5 text-xs font-semibold flex items-center gap-1 text-slate-300 hover:text-purple-300"
                        >
                          <Eye size={14} /> View Invoice
                        </button>

                        {challan.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateStatus(challan, 'CONFIRMED')}
                            className="btn-primary py-1 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-500 flex items-center gap-1"
                            title="Confirm & Deduct Inventory Stock"
                          >
                            <CheckCircle2 size={13} /> Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Sales Challan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="glass-card max-w-3xl w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="text-purple-500" size={22} /> Create New Sales Challan
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <div className="space-y-6">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="input-field py-2.5 px-3 text-sm w-full font-semibold cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name} ({c.businessName}) — {c.customerType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Line Item List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Line Item Products *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="btn-secondary py-1 px-3 text-xs font-semibold flex items-center gap-1 text-purple-400 hover:text-purple-300"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, idx) => {
                    const selectedProd = productMap.get(item.productId);
                    const subtotal = selectedProd ? selectedProd.unitPrice * (item.quantity || 0) : 0;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        {/* Product Picker */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] text-slate-400 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                            className="input-field py-1.5 px-2 text-xs w-full font-semibold cursor-pointer"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id} className="bg-slate-900">
                                [{p.sku}] {p.name} (Stock: {p.currentStock})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stock & Unit Price Info */}
                        <div className="sm:col-span-2 text-xs">
                          <span className="block text-[11px] text-slate-400">Price</span>
                          <span className="font-semibold text-slate-200">
                            ₹{selectedProd?.unitPrice ? selectedProd.unitPrice.toLocaleString() : '0'}
                          </span>
                        </div>

                        {/* Quantity Input */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                            className="input-field py-1 px-2 text-xs w-full font-bold text-slate-100"
                          />
                        </div>

                        {/* Line Subtotal */}
                        <div className="sm:col-span-2 text-xs">
                          <span className="block text-[11px] text-slate-400">Subtotal</span>
                          <span className="font-extrabold text-amber-400">
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Delete Action */}
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            disabled={lineItems.length === 1}
                            className="text-slate-500 hover:text-red-400 p-1 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400">Total Quantity:</p>
                  <p className="text-lg font-bold text-slate-100">{calculatedTotalQuantity} Units</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Grand Invoice Total:</p>
                  <p className="text-2xl font-black text-emerald-400">
                    ₹{calculatedTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleCreateChallanSubmit('DRAFT')}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                >
                  {formSubmitting ? 'Saving...' : 'Save as DRAFT'}
                </button>

                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleCreateChallanSubmit('CONFIRMED')}
                  className="btn-primary py-2.5 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-500 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={15} /> Confirm & Deduct Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challan Invoice Viewer & Printable Document Modal */}
      {viewingChallan && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="glass-card max-w-3xl w-full p-8 rounded-2xl border border-slate-800 shadow-2xl relative my-8 text-slate-100">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 print:hidden">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} /> Printable Document Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1 text-slate-200 hover:text-white"
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button
                  onClick={() => setViewingChallan(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Official Invoice Document Structure */}
            <div className="space-y-6">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-100 tracking-tight">FUNDSROOM INFOTECH</h1>
                  <p className="text-xs text-slate-400 font-medium">Operations & Wholesale Distribution Division</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Plot 105, Tech Park Phase II, Pune, MH 411057 | GST: 27AAAAF1234F1Z0
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono uppercase text-slate-400 block">Sales Delivery Challan</span>
                  <span className="text-xl font-mono font-black text-purple-400 block mt-0.5">
                    {viewingChallan.challanNumber}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-2 border ${
                      viewingChallan.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : viewingChallan.status === 'DRAFT'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}
                  >
                    STATUS: {viewingChallan.status}
                  </span>
                </div>
              </div>

              {/* Customer & Issue Info Grid */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Customer Billed To:</p>
                  <p className="font-extrabold text-slate-100 text-sm">{viewingChallan.customer.name}</p>
                  <p className="font-semibold text-slate-300">{viewingChallan.customer.businessName}</p>
                  <p className="text-slate-400 mt-1">Mobile: {viewingChallan.customer.mobile}</p>
                  <p className="text-slate-400">Email: {viewingChallan.customer.email}</p>
                  {viewingChallan.customer.address && (
                    <p className="text-slate-400 mt-1">Address: {viewingChallan.customer.address}</p>
                  )}
                  {viewingChallan.customer.gstNumber && (
                    <p className="text-slate-400 font-mono text-[11px] mt-1">GSTIN: {viewingChallan.customer.gstNumber}</p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Issue Details:</p>
                  <p><span className="text-slate-500">Challan Date:</span> <strong className="text-slate-200 font-mono">{new Date(viewingChallan.createdAt).toLocaleDateString()}</strong></p>
                  <p><span className="text-slate-500">Time:</span> <strong className="text-slate-200 font-mono">{new Date(viewingChallan.createdAt).toLocaleTimeString()}</strong></p>
                  <p><span className="text-slate-500">Generated By:</span> <strong className="text-slate-200">{viewingChallan.author.name}</strong> ({viewingChallan.author.role})</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-2.5 px-3 font-semibold">#</th>
                      <th className="py-2.5 px-3 font-semibold">Item Snapshot Description</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {viewingChallan.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-100">{item.productNameSnapshot}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          ₹{item.unitPriceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-100">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-bold text-amber-400">
                          ₹{(item.unitPriceSnapshot * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">
                  Total Dispatched Quantity: <strong className="text-slate-100 text-sm ml-1">{viewingChallan.totalQuantity} Pcs</strong>
                </span>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Amount Payable:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{viewingChallan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Footer Sign-off Block */}
              <div className="pt-8 border-t border-slate-800 flex justify-between items-end text-[11px] text-slate-500">
                <div>
                  <p className="font-semibold text-slate-400">Receiver's Signature & Stamp</p>
                  <div className="h-10 border-b border-dashed border-slate-700 w-48 mt-2"></div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-400">Authorized Signatory</p>
                  <p className="text-slate-300 font-bold mt-8">For Fundsroom Infotech Pvt. Ltd.</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3 print:hidden">
              {viewingChallan.status === 'DRAFT' && (
                <button
                  onClick={() => handleUpdateStatus(viewingChallan, 'CONFIRMED')}
                  className="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-500 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Confirm & Deduct Inventory Stock
                </button>
              )}

              <button
                onClick={() => setViewingChallan(null)}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
