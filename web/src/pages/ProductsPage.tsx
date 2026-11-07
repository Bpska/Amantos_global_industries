import React, { useEffect, useState } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  IndianRupee,
} from 'lucide-react';
import { api } from '../services/api';
import type { Product } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      setProducts(res);
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setUnitPrice('10');
    setCategory('Snacks');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setUnitPrice(String(p.unitPrice));
    setCategory(p.category || 'General');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Valid unit price greater than 0 is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: name.trim(),
          unitPrice: priceNum,
          category: category.trim(),
        });
      } else {
        await api.addProduct({
          name: name.trim(),
          unitPrice: priceNum,
          category: category.trim(),
        });
      }
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { isActive: !p.isActive });
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to remove "${prodName}" from active catalog?`)) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to remove product');
      }
    }
  };

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Product Catalog & SKU Master
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Configure inventory products and default unit rates displayed across the field seller app
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadProducts} className="btn btn-outline" style={{ gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ gap: '6px' }}>
            <PlusCircle size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '42px' }}
              placeholder="Search products by SKU name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`btn ${categoryFilter === c ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '999px' }}
              >
                {c === 'ALL' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product / SKU Name</th>
                <th>Category</th>
                <th>Default Base Rate</th>
                <th>Seller App Status</th>
                <th>Date Configured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Loading product catalog…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No products found matching the criteria. Click "Add New Product" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#007F5F',
                          flexShrink: 0,
                        }}>
                          <Package size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>ID: {p.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                      }}>
                        <Tag size={11} color="#64748B" />
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#10B981', fontSize: '15px' }}>
                        ₹{Number(p.unitPrice).toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: p.isActive ? '#ECFDF5' : '#FEF2F2',
                          color: p.isActive ? '#047857' : '#DC2626',
                        }}
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle2 size={13} color="#10B981" />
                            <span>Active in Seller App</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} color="#DC2626" />
                            <span>Hidden / Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748B' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#DC2626', borderColor: '#FECACA' }}
                          title="Remove from Catalog"
                        >
                          <Trash2 size={13} />
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Inventory Product'}
                </h3>
                <p className="modal-sub">
                  This product will immediately appear in the field seller dashboard for ordering
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Product / SKU Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Masala Bhujia 400g"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Line</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Snacks">Snacks / Namkeen</option>
                    <option value="Beverages">Beverages / Tea / Coffee</option>
                    <option value="Sweets">Sweets / Mithai</option>
                    <option value="Spices">Spices / Masale</option>
                    <option value="Dairy">Dairy / Essentials</option>
                    <option value="General">General Merchandise</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Base Unit Rate (₹ — allows fractions & numbers) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="e.g. 15.50 or 50"
                      required
                    />
                    <IndianRupee
                      size={15}
                      color="#94A3B8"
                      style={{ position: 'absolute', left: '10px', top: '13px' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Sellers can adjust the unit rate or use this default during store orders.
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editingProduct ? 'Save Product Changes' : 'Publish Product to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

