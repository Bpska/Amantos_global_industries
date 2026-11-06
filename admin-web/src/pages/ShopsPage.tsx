import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Store,
  PlusCircle,
  Banknote,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Send,
} from 'lucide-react';
import { api } from '../services/api';
import type { Shop, User as UserType } from '../types';

export const ShopsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialShopId = searchParams.get('id') || '';
  const initialStatus = searchParams.get('status') || 'ALL';

  const [shops, setShops] = useState<Shop[]>([]);
  const [salespersons, setSalespersons] = useState<UserType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [salespersonId, setSalespersonId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Shop details drawer
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // Modal actions
  const [actionModal, setActionModal] = useState<'order' | 'pay' | null>(null);
  const [orderProduct, setOrderProduct] = useState('Mixture Pack 500g');
  const [orderQty, setOrderQty] = useState('50');
  const [orderPrice, setOrderPrice] = useState('10');
  const [orderNotes, setOrderNotes] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await api.getShops({
        page,
        limit: 12,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        salespersonId: salespersonId || undefined,
        from: startDate ? new Date(startDate).toISOString() : undefined,
        to: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
      });
      setShops(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load shops:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const reps = await api.getSalespersons();
      setSalespersons(reps);
    } catch (e) {
      console.error('Failed to load salespersons:', e);
    }
  };

  useEffect(() => {
    fetchSalespersons();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [page, status, salespersonId, startDate, endDate]);

  // Handle auto-opening shop if URL has id
  useEffect(() => {
    if (initialShopId) {
      openShopDetails(initialShopId);
    }
  }, [initialShopId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  const openShopDetails = async (id: string) => {
    try {
      const shop = await api.getShopById(id);
      setSelectedShop(shop);
      setSearchParams({ id });
    } catch (e) {
      console.error('Failed to get shop details:', e);
    }
  };

  const closeShopDetails = () => {
    setSelectedShop(null);
    setSearchParams({});
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    try {
      setActionLoading(true);
      await api.addOrder(selectedShop.id, {
        product: orderProduct,
        quantity: Number(orderQty),
        unitPrice: Number(orderPrice),
        notes: orderNotes.trim() || undefined,
      });
      setActionModal(null);
      // Reload details and list
      await openShopDetails(selectedShop.id);
      fetchShops();
      alert('Order created and credited to shop ledger.');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    const dueOrder = selectedShop.orders?.find((o) => o.baki > 0) || selectedShop.orders?.[0];
    if (!dueOrder) {
      alert('No outstanding order to settle.');
      return;
    }
    try {
      setActionLoading(true);
      await api.payOrder(dueOrder.id, Number(payAmount));
      setActionModal(null);
      setPayAmount('');
      await openShopDetails(selectedShop.id);
      fetchShops();
      alert('Payment collected and updated in store ledger.');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Retailer Master Directory
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Comprehensive directory of all {total} enrolled retail merchant accounts
          </p>
        </div>

        <button onClick={fetchShops} className="btn btn-outline" style={{ gap: '6px' }}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '42px' }}
              placeholder="Search by store name, proprietor, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          </form>

          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'ALL', label: 'All Accounts' },
              { key: 'PAID', label: 'Settled' },
              { key: 'PARTIAL', label: 'Partial BAKI' },
              { key: 'UNPAID', label: 'Full Credit' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStatus(s.key);
                  setPage(1);
                }}
                className={`btn ${status === s.key ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '999px' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Salesperson Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-input"
              style={{ height: '42px', padding: '0 12px', fontSize: '13px', fontWeight: 600 }}
              value={salespersonId}
              onChange={(e) => {
                setSalespersonId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Field Reps</option>
              {salespersons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0F172A', fontSize: '12px', fontWeight: 800 }}>
              <Calendar size={15} color="#1D4ED8" />
              <span>Date:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>FROM</span>
              <input
                type="date"
                className="form-input"
                style={{ height: '38px', padding: '0 8px', fontSize: '12px', width: 'auto' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8' }}>TO</span>
              <input
                type="date"
                className="form-input"
                style={{ height: '38px', padding: '0 8px', fontSize: '12px', width: 'auto' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="btn btn-outline"
                style={{ height: '36px', padding: '0 8px', fontSize: '11px', color: '#DC2626', borderColor: '#FECACA' }}
                title="Reset Date Filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Retailers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Store Identity</th>
                <th>Proprietor Details</th>
                <th>Trade Location</th>
                <th>Assigned Rep</th>
                <th>Total Billed</th>
                <th>Collected</th>
                <th>Pending BAKI</th>
                <th>Ledger Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading Retailer Ledger Directory…</div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <Store size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>No Retailer Accounts Found</div>
                    <div style={{ fontSize: '12px' }}>Try adjusting your search terms or filters above.</div>
                  </td>
                </tr>
              ) : (
                shops.map((shop) => {
                  const initial = (shop.name || 'S').trim().charAt(0).toUpperCase();
                  const isPaid = shop.baki === 0;
                  const isPartial = shop.baki > 0 && shop.paidAmount > 0;
                  return (
                    <tr key={shop.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{shop.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>ID: {shop.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{shop.ownerName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>+91 {shop.contactNumber}</div>
                      </td>
                      <td style={{ maxWidth: '180px' }}>
                        <div style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shop.location}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>
                          {shop.salesperson?.name || 'Field Rep'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatMoney(shop.totalAmount)}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{formatMoney(shop.paidAmount)}</td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: isPaid ? '#10B981' : '#DC2626' }}>
                          {formatMoney(shop.baki)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-baki'}`}>
                          {isPaid ? 'Settled' : isPartial ? 'Partial BAKI' : 'Full Credit'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openShopDetails(shop.id)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
        }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Showing <strong>{shops.length}</strong> of <strong>{total}</strong> stores
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-outline"
              style={{ padding: '6px 12px' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0F172A',
            }}>
              Page {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={shops.length < 12}
              className="btn btn-outline"
              style={{ padding: '6px 12px' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Shop Detail Drawer / Modal */}
      {selectedShop && (
        <div className="modal-backdrop" onClick={closeShopDetails}>
          <div className="modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1D4ED8',
                }}>
                  <Store size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{selectedShop.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Proprietor: {selectedShop.ownerName} · +91 {selectedShop.contactNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={closeShopDetails}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Financial Summary Ribbon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    TOTAL BILLED
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {formatMoney(selectedShop.totalAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    COLLECTED
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    {formatMoney(selectedShop.paidAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>
                    OUTSTANDING BAKI
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                    {formatMoney(selectedShop.baki)}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Administrator */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => setActionModal('order')}
                  className="btn btn-primary"
                  style={{ flex: 1, gap: '6px' }}
                >
                  <PlusCircle size={16} />
                  <span>Dispatch New Order</span>
                </button>
                <button
                  onClick={() => {
                    setPayAmount(String(selectedShop.baki));
                    setActionModal('pay');
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1, gap: '6px' }}
                  disabled={selectedShop.baki <= 0}
                >
                  <Banknote size={16} />
                  <span>Record BAKI Collection</span>
                </button>
              </div>

              {/* Order History Table */}
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
                Stock Dispatch & Order History ({selectedShop.orders?.length || 0})
              </h4>

              <div className="table-responsive" style={{ border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU / Product</th>
                      <th>Qty & Rate</th>
                      <th>Order Total</th>
                      <th>Paid</th>
                      <th>BAKI Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Bill & WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedShop.orders || selectedShop.orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                          No dispatches on record for this store.
                        </td>
                      </tr>
                    ) : (
                      selectedShop.orders.map((o, idx) => (
                        <tr key={o.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{o.product}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              #{idx + 1} · {new Date(o.date).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {o.quantity} pcs @ ₹{o.unitPrice}
                          </td>
                          <td style={{ fontWeight: 800 }}>{formatMoney(o.totalAmount)}</td>
                          <td style={{ fontWeight: 800, color: '#10B981' }}>{formatMoney(o.paidAmount)}</td>
                          <td>
                            <span style={{ fontWeight: 800, color: o.baki > 0 ? '#DC2626' : '#10B981' }}>
                              {formatMoney(o.baki)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${o.baki === 0 ? 'badge-paid' : 'badge-baki'}`}>
                              {o.baki === 0 ? 'Settled' : 'Due'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {o.billingType === 'PHYSICAL' ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#D97706',
                                backgroundColor: '#FEF3C7',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                              }}>
                                📄 Physical Bill
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const invNo = o.invoiceNumber || `INV-${new Date(o.date).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`;
                                  const dateStr = new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                  const text = 
`🧾 *AGI RETAIL DISTRIBUTION*
━━━━━━━━━━━━━━━━━━━━
📄 *Tax Invoice / Cash Memo:* ${invNo}
📅 *Date:* ${dateStr}
🏪 *Store:* ${selectedShop.name}
👤 *Proprietor:* ${selectedShop.ownerName}
📞 *Mobile:* +91 ${selectedShop.contactNumber}
📍 *Location:* ${selectedShop.location}
━━━━━━━━━━━━━━━━━━━━
📦 *DISPATCH DETAILS:*
• Item: *${o.product}*
• Quantity: *${o.quantity} units*
• Unit Rate: *₹${Number(o.unitPrice || 0).toFixed(2)}*
• Total Invoiced: *₹${Number(o.totalAmount || 0).toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT BREAKDOWN:*
• Paid Amount: *₹${Number(o.paidAmount || 0).toFixed(2)}*
• Balance Due (BAKI): *₹${Number(o.baki || 0).toFixed(2)}*
• Status: *${o.baki === 0 ? '✅ FULLY PAID' : (o.paidAmount > 0 ? '⚠️ PARTIAL' : '🔴 UNPAID / DUE')}*
━━━━━━━━━━━━━━━━━━━━
🙏 Thank you for your business! Reach out to your sales executive for repeat orders.`;
                                  const cleanPhone = (selectedShop.contactNumber || '').replace(/[^0-9]/g, '');
                                  const p = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                                  window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                style={{
                                  backgroundColor: '#25D366',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Send invoice to retailer WhatsApp"
                              >
                                <Send size={11} />
                                <span>WhatsApp</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Sub-Modals: New Order or Pay */}
      {actionModal && selectedShop && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
                {actionModal === 'order' ? 'New Inventory Order' : 'Record Payment Collection'}
              </h3>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {actionModal === 'order' ? (
              <form onSubmit={handleCreateOrder}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Product / SKU Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={orderProduct}
                      onChange={(e) => setOrderProduct(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={orderQty}
                        onChange={(e) => setOrderQty(e.target.value)}
                        required
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit Price (₹ — number or fraction)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        required
                        min="0.01"
                        step="any"
                        placeholder="e.g. 12.50"
                      />
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    border: '1px solid #E2E8F0',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Calculated Total:</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1D4ED8' }}>
                      {formatMoney(Number(orderQty || 0) * Number(orderPrice || 0))}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Remarks / Dispatch Note (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Dispatched via morning delivery van"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setActionModal(null)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving Order…' : 'Confirm Order Dispatch'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCollectPayment}>
                <div className="modal-body">
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '10px',
                    border: '1px solid #FECACA',
                    marginBottom: '16px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>
                      OUTSTANDING BAKI BALANCE
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                      {formatMoney(selectedShop.baki)}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount Collected (₹ — number or fraction)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="e.g. 150.50"
                      required
                      min="0.01"
                      step="any"
                      max={selectedShop.baki}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setActionModal(null)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Recording Collection…' : 'Record Payment Receipt'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
