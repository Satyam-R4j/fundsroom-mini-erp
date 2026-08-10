import React, { useState, useEffect } from 'react';
import {
  productService,
  Product,
  StockLog,
  CreateProductPayload,
} from '../services/productService';
import {
  PackageCheck,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Edit2,
  X,
  Warehouse,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Modals & Active Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // Form States
  const [productForm, setProductForm] = useState<CreateProductPayload>({
    name: '',
    sku: '',
    category: 'Power Tools',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: 'Main Warehouse',
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState<{
    movementType: 'IN' | 'OUT';
    quantityChanged: number;
    reason: string;
  }>({
    movementType: 'IN',
    quantityChanged: 1,
    reason: '',
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch products catalog
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts({
        q: searchQuery,
        category: selectedCategory,
        lowStock: showLowStockOnly,
      });
      setProducts(data);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.response?.data?.message || 'Failed to load inventory products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, showLowStockOnly]);

  // Open Product Details & History Drawer
  const handleOpenHistory = async (product: Product) => {
    try {
      const detailedProduct = await productService.getProductById(product.id);
      setHistoryProduct(detailedProduct);
    } catch (err: any) {
      alert('Failed to load stock logs for this product.');
    }
  };

  // Handle Product Create / Edit Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          name: productForm.name,
          category: productForm.category,
          unitPrice: Number(productForm.unitPrice),
          minStockAlert: Number(productForm.minStockAlert),
          location: productForm.location,
        });
      } else {
        await productService.createProduct({
          ...productForm,
          unitPrice: Number(productForm.unitPrice),
          currentStock: Number(productForm.currentStock),
          minStockAlert: Number(productForm.minStockAlert),
        });
      }

      setIsAddModalOpen(false);
      setEditingProduct(null);
      resetProductForm();
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save product details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Stock Adjustment Submit (IN / OUT)
  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    setFormError(null);
    setFormSubmitting(true);

    try {
      await productService.adjustStock(adjustingProduct.id, {
        movementType: stockAdjustmentForm.movementType,
        quantityChanged: Number(stockAdjustmentForm.quantityChanged),
        reason: stockAdjustmentForm.reason.trim() || 'Inventory adjustment',
      });

      setAdjustingProduct(null);
      setStockAdjustmentForm({ movementType: 'IN', quantityChanged: 1, reason: '' });
      fetchProducts();

      // Refresh history drawer if open
      if (historyProduct?.id === adjustingProduct.id) {
        handleOpenHistory(adjustingProduct);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to adjust stock level.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      category: 'Power Tools',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      location: 'Main Warehouse',
    });
    setFormError(null);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      minStockAlert: product.minStockAlert,
      location: product.location,
    });
    setIsAddModalOpen(true);
  };

  // Metrics
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);

  // Extract unique categories for filter
  const categoriesList = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <PackageCheck className="text-amber-500" size={28} /> Product & Inventory Catalog
          </h2>
          <p className="text-sm text-slate-400">
            Real-time stock level monitoring, minimum thresholds, and movement audit trail logs.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            resetProductForm();
            setIsAddModalOpen(true);
          }}
          className="btn-primary py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/20">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-black text-slate-100">{totalProducts}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20">
            <PackageCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total In-Stock Units</p>
            <p className="text-2xl font-black text-slate-100">{totalStockUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className={`glass-card p-4 rounded-xl border flex items-center gap-4 transition-all ${
          lowStockCount > 0
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-slate-800/80'
        }`}>
          <div className={`p-3 rounded-xl border ${
            lowStockCount > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
            <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {lowStockCount} {lowStockCount > 0 && <span className="text-xs font-normal text-amber-300 font-sans">(Action Needed)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by SKU, product name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-4 py-2 w-full text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950 cursor-pointer"
            />
            <span className={showLowStockOnly ? 'text-amber-400' : ''}>Low Stock Alerts Only</span>
          </label>
        </div>
      </div>

      {/* Product Catalog Table */}
      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-2xl">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading product inventory catalog...
        </div>
      ) : error ? (
        <div className="glass-card p-6 rounded-2xl border border-red-500/30 text-red-400 text-center">
          <AlertCircle className="mx-auto mb-2" size={32} />
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-2xl">
          <PackageCheck size={48} className="mx-auto mb-3 text-slate-600" />
          <p className="text-lg font-semibold text-slate-300">No products found matching filters.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or add a new product catalog item.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 font-semibold">SKU / Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Unit Price</th>
                  <th className="py-3.5 px-4 font-semibold">Live Stock Status</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((product) => {
                  const isLowStock = product.currentStock <= product.minStockAlert;
                  return (
                    <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 mr-2">
                            {product.sku}
                          </span>
                          <span className="font-bold text-slate-100">{product.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          <Tag size={12} className="text-slate-400" />
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        ₹{product.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                              isLowStock
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isLowStock ? (
                              <>
                                <AlertTriangle size={13} className="animate-pulse" />
                                {product.currentStock} units (Low Stock)
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} />
                                {product.currentStock} units
                              </>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            (Min: {product.minStockAlert})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Warehouse size={13} className="text-slate-500" />
                          {product.location}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setStockAdjustmentForm({
                                movementType: 'IN',
                                quantityChanged: 1,
                                reason: '',
                              });
                            }}
                            className="btn-secondary py-1 px-2.5 text-xs font-semibold flex items-center gap-1 hover:border-amber-500/50 hover:text-amber-300"
                            title="Adjust Stock (IN/OUT)"
                          >
                            <ArrowUpRight size={13} className="text-emerald-400" />
                            <ArrowDownLeft size={13} className="text-red-400" />
                            Adjust Stock
                          </button>

                          <button
                            onClick={() => handleOpenHistory(product)}
                            className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 text-slate-300 hover:text-blue-400"
                            title="View Stock Audit Logs"
                          >
                            <History size={14} />
                          </button>

                          <button
                            onClick={() => handleEditClick(product)}
                            className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 text-slate-300 hover:text-amber-400"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PackageCheck className="text-amber-500" size={22} />
                {editingProduct ? 'Edit Product Catalog Item' : 'Add New Product to Inventory'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
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

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Safety Helmet"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="input-field py-2 px-3 text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    placeholder="e.g. SAF-HLM-001"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    className={`input-field py-2 px-3 text-sm w-full font-mono uppercase ${
                      editingProduct ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Safety Equipment"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="input-field py-2 px-3 text-sm w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="input-field py-2 px-3 text-sm w-full"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={productForm.currentStock}
                      onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                      className="input-field py-2 px-3 text-sm w-full"
                    />
                  </div>
                )}

                <div className={editingProduct ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) || 5 })}
                    className="input-field py-2 px-3 text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  placeholder="e.g. Shelf B-4, Main Warehouse"
                  value={productForm.location}
                  onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                  className="input-field py-2 px-3 text-sm w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Adjust Inventory Stock
                </h3>
                <p className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                  [{adjustingProduct.sku}] {adjustingProduct.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
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

            <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
              {/* Movement Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Movement Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentForm({ ...stockAdjustmentForm, movementType: 'IN' })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      stockAdjustmentForm.movementType === 'IN'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ArrowUpRight size={16} /> IN (Receive Stock)
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockAdjustmentForm({ ...stockAdjustmentForm, movementType: 'OUT' })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      stockAdjustmentForm.movementType === 'OUT'
                        ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ArrowDownLeft size={16} /> OUT (Dispatch Stock)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity to {stockAdjustmentForm.movementType === 'IN' ? 'Add' : 'Deduct'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockAdjustmentForm.quantityChanged}
                  onChange={(e) =>
                    setStockAdjustmentForm({
                      ...stockAdjustmentForm,
                      quantityChanged: parseInt(e.target.value) || 1,
                    })
                  }
                  className="input-field py-2 px-3 text-sm w-full font-bold text-slate-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Current live stock: <strong className="text-slate-200">{adjustingProduct.currentStock}</strong> → New stock level will be:{' '}
                  <strong className="text-amber-400">
                    {stockAdjustmentForm.movementType === 'IN'
                      ? adjustingProduct.currentStock + (stockAdjustmentForm.quantityChanged || 0)
                      : adjustingProduct.currentStock - (stockAdjustmentForm.quantityChanged || 0)}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    stockAdjustmentForm.movementType === 'IN'
                      ? 'e.g. Supplier delivery received'
                      : 'e.g. Sales dispatch / Internal usage'
                  }
                  value={stockAdjustmentForm.reason}
                  onChange={(e) =>
                    setStockAdjustmentForm({ ...stockAdjustmentForm, reason: e.target.value })
                  }
                  className="input-field py-2 px-3 text-sm w-full"
                />
              </div>

              {/* Shortcut buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Supplier Delivery', 'Stock Return', 'Inventory Audit', 'Damaged Stock'].map((shortcut) => (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => setStockAdjustmentForm({ ...stockAdjustmentForm, reason: shortcut })}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded-md"
                  >
                    + {shortcut}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={`btn-primary py-2 px-5 text-xs font-bold ${
                    stockAdjustmentForm.movementType === 'OUT' ? 'bg-red-600 hover:bg-red-500 border-red-500' : ''
                  }`}
                >
                  {formSubmitting ? 'Logging...' : `Confirm ${stockAdjustmentForm.movementType} Movement`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Audit Trail Drawer */}
      {historyProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
          <div className="glass-card max-w-md w-full h-full p-6 border-l border-slate-800 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <History className="text-amber-500" size={20} /> Stock Audit Log History
                  </h3>
                  <p className="text-xs text-amber-400 font-mono font-bold">
                    [{historyProduct.sku}] {historyProduct.name}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryProduct(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current Stock Level:</span>
                  <span className="font-bold text-slate-100 text-sm">
                    {historyProduct.currentStock} units
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Movement Activity Logs ({historyProduct.stockLogs?.length || 0})
                </h4>

                {(!historyProduct.stockLogs || historyProduct.stockLogs.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    No stock adjustments logged for this product yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historyProduct.stockLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                              log.movementType === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {log.movementType === 'IN' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {log.movementType} ({log.quantityChanged} units)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-slate-200 font-medium pt-1">{log.reason}</p>

                        {log.user && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                            Logged by: <strong className="text-slate-300">{log.user.name}</strong> ({log.user.role})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => setHistoryProduct(null)}
                className="btn-secondary w-full py-2 text-xs font-semibold"
              >
                Close Audit Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
