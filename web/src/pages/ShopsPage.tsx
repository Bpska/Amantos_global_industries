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
  Phone,
  MapPin,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDayAndDate, formatFullDayDate } from '../utils/dateUtils';
import type { BillingSetting, Shop, User as UserType } from '../types';

export const ShopsPage: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'SALESPERSON';
  const isAdmin = user?.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialShopId = searchParams.get('id') || '';
  const initialStatus = searchParams.get('status') || 'ALL';
  const [billingSettings, setBillingSettings] = useState<BillingSetting | null>(null);

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

  // Onboard new retailer modal
  const [createModalOpen, setCreateModalOpen] = useState(searchParams.get('new') === '1');
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRepId, setNewRepId] = useState('');
  const [newProduct, setNewProduct] = useState('Mixture Pack 500g');
  const [newQty, setNewQty] = useState('100');
  const [newPrice, setNewPrice] = useState('120');
  const [newPaid, setNewPaid] = useState('0');

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newOwnerName.trim() || !newContact.trim()) {
      alert('Store name, proprietor name, and contact mobile are required.');
      return;
    }
    try {
      setActionLoading(true);
      await api.createShop({
        name: newShopName,
        ownerName: newOwnerName,
        contactNumber: newContact,
        location: newLocation || 'Bhubaneswar, Odisha',
        salespersonId: isStaff ? user.id : newRepId || undefined,
        openingOrderProduct: newProduct,
        openingOrderQuantity: Number(newQty),
        openingOrderPrice: Number(newPrice),
        initialPaidAmount: Number(newPaid),
      });
      setCreateModalOpen(false);
      setNewShopName('');
      setNewOwnerName('');
      setNewContact('');
      setNewLocation('');
      await fetchShops();
    } catch (err: any) {
      alert(err.message || 'Failed to onboard retailer');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await api.getShops({
        page,
        limit: 12,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        salespersonId: isStaff ? user.id : salespersonId || undefined,
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
    if (isStaff) return;
    try {
      const reps = await api.getSalespersons();
      setSalespersons(reps);
    } catch (e) {
      console.error('Failed to load salespersons:', e);
    }
  };

  useEffect(() => {
    fetchSalespersons();
    api.getBillingSettings().then(setBillingSettings).catch(() => {});
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
    const dueOrders = selectedShop.orders?.filter((order) => order.baki > 0) || [];
    if (!dueOrders.length) {
      alert('No outstanding order to settle.');
      return;
    }
    try {
      setActionLoading(true);
      let remaining = Number(payAmount);
      const totalDue = dueOrders.reduce((sum, order) => sum + order.baki, 0);
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > totalDue) {
        throw new Error('Enter an amount greater than zero and no more than the outstanding balance.');
      }
      for (const order of dueOrders) {
        if (remaining <= 0) break;
        const amount = Math.min(remaining, order.baki);
        await api.payOrder(order.id, amount);
        remaining -= amount;
      }
      setActionModal(null);
      setPayAmount('');
      await openShopDetails(selectedShop.id);
      fetchShops();
      alert('Payment collected and updated in store ledger.');
    } catch (e: any) {
      alert(e.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Page Title & Controls */}
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            {isStaff ? 'My Retailers' : 'Retailer Master Directory'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {isStaff ? `${total} retailers assigned to you. Add orders and collect outstanding BAKI.` :
              `Comprehensive directory of all ${total} enrolled retail merchant accounts`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary" style={{ gap: '6px' }}>
            <PlusCircle size={15} />
            <span>Onboard Retailer</span>
          </button>
          <button onClick={fetchShops} className="btn btn-outline" style={{ gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
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
          <div className="filter-pills-scroll">
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
                style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '999px', whiteSpace: 'nowrap' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Salesperson Filter */}
          {!isStaff && <div style={{ minWidth: '180px' }}>
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
          </div>}

          {/* Date Filter Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0F172A', fontSize: '12px', fontWeight: 800 }}>
              <Calendar size={15} color="#007F5F" />
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

      {/* Main Retailers Table & Mobile Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive desktop-table-view">
          <table className="data-table">
            <thead>
              <tr>
                <th>Store Identity</th>
                <th>Onboarded Day & Date</th>
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
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading Retailer Ledger Directory…</div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
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
                            color: '#007F5F',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#007F5F" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {formatDayAndDate(shop.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', paddingLeft: '19px' }}>
                          Enrolled Partner
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
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#007F5F' }}>
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

        {/* Mobile Cards View (Visible on screens <= 768px) */}
        <div className="mobile-cards-view">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading Retailers…</div>
            </div>
          ) : shops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
              <Store size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '15px' }}>No Retailer Accounts Found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search terms or filters above.</div>
            </div>
          ) : (
            shops.map((shop) => {
              const initial = (shop.name || 'S').trim().charAt(0).toUpperCase();
              const isPaid = shop.baki === 0;
              const isPartial = shop.baki > 0 && shop.paidAmount > 0;
              const cleanPhone = (shop.contactNumber || '').replace(/[^0-9]/g, '');

              return (
                <div key={shop.id} className="mobile-retailer-card">
                  {/* Card Header */}
                  <div className="mobile-card-header">
                    <div className="mobile-shop-info">
                      <div className="mobile-shop-avatar">{initial}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="mobile-shop-name">{shop.name}</div>
                        <div className="mobile-shop-sub">Prop: {shop.ownerName}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#007F5F', fontWeight: 700, backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                          <Calendar size={11} />
                          <span>Onboarded: {formatDayAndDate(shop.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-baki'}`}>
                      {isPaid ? 'Settled' : `${formatMoney(shop.baki)} Due`}
                    </span>
                  </div>

                  {/* Contact & Location Details */}
                  <div className="mobile-shop-details">
                    <div className="mobile-shop-detail-row">
                      <MapPin size={13} color="#64748B" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shop.location || 'Bhubaneswar, Odisha'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <a
                        href={`tel:${cleanPhone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#007F5F',
                          fontWeight: 700,
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        <Phone size={13} />
                        <span>+91 {shop.contactNumber}</span>
                      </a>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Rep: {shop.salesperson?.name?.split(' ')[0] || 'Field'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Ribbon */}
                  <div className="mobile-shop-financials">
                    <div className="mobile-fin-item">
                      <span className="mobile-fin-label">Billed</span>
                      <span className="mobile-fin-value">{formatMoney(shop.totalAmount)}</span>
                    </div>
                    <div className="mobile-fin-item">
                      <span className="mobile-fin-label">Collected</span>
                      <span className="mobile-fin-value" style={{ color: '#10B981' }}>{formatMoney(shop.paidAmount)}</span>
                    </div>
                    <div className="mobile-fin-item">
                      <span className="mobile-fin-label">BAKI Due</span>
                      <span className="mobile-fin-value" style={{ color: isPaid ? '#10B981' : '#DC2626' }}>
                        {formatMoney(shop.baki)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShop(shop);
                        setActionModal('order');
                      }}
                      className="btn btn-primary mobile-card-btn"
                    >
                      <PlusCircle size={13} />
                      <span>+ Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShop(shop);
                        setPayAmount(String(shop.baki));
                        setActionModal('pay');
                      }}
                      className="btn btn-outline mobile-card-btn"
                      disabled={shop.baki <= 0}
                      style={{ color: shop.baki > 0 ? '#DC2626' : '#94A3B8', borderColor: shop.baki > 0 ? '#FECACA' : '#E2E8F0' }}
                    >
                      <Banknote size={13} />
                      <span>Collect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openShopDetails(shop.id)}
                      className="btn btn-outline mobile-card-btn"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          flexWrap: 'wrap',
          gap: '10px',
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
                  color: '#007F5F',
                }}>
                  <Store size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{selectedShop.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span>Proprietor: <strong>{selectedShop.ownerName}</strong> · +91 {selectedShop.contactNumber}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#007F5F', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>Onboarded: {formatFullDayDate(selectedShop.createdAt)}</span>
                    </span>
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
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    TOTAL BILLED
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '2px', overflowWrap: 'anywhere' }}>
                    {formatMoney(selectedShop.totalAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    COLLECTED
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981', marginTop: '2px', overflowWrap: 'anywhere' }}>
                    {formatMoney(selectedShop.paidAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>
                    OUTSTANDING BAKI
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#DC2626', marginTop: '2px', overflowWrap: 'anywhere' }}>
                    {formatMoney(selectedShop.baki)}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Administrator */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActionModal('order')}
                  className="btn btn-primary"
                  style={{ flex: '1 1 160px', gap: '6px' }}
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
                  style={{ flex: '1 1 160px', gap: '6px' }}
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
                            <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                              <Calendar size={11} color="#007F5F" />
                              <span>#{idx + 1} · {formatFullDayDate(o.date)}</span>
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
                            ) : isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAdmin) return;
                                  const invNo = o.invoiceNumber || `INV-${new Date(o.date).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`;
                                  const dateStr = formatFullDayDate(o.date);
                                  const brandTitle = (billingSettings?.businessName || 'Amantos Global Industries').toUpperCase();
                                  const text = 
`🧾 *${brandTitle}*
━━━━━━━━━━━━━━━━━━━━
📄 *Tax Invoice / Cash Memo:* ${invNo}
📅 *Billing Day & Date:* ${dateStr}
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
📄 *Digital Bill:* Official PDF Tax Invoice generated.
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
                            ) : null}
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

                  <div className="form-grid-2">
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
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#007F5F' }}>
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
      {/* Onboard Retailer Modal */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} color="#007F5F" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  Onboard New Retail Merchant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateShop}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Store / Shop Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. Maa Mangala Provision Store"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Proprietor Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Sahoo"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="e.g. 9861012345"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Saheed Nagar Market, Bhubaneswar"
                  />
                </div>

                {!isStaff && <div className="form-group">
                  <label className="form-label">Assigned Sales Representative</label>
                  <select
                    className="form-input"
                    value={newRepId}
                    onChange={(e) => setNewRepId(e.target.value)}
                  >
                    <option value="">Default (First Available Representative)</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} (@{sp.username})
                      </option>
                    ))}
                  </select>
                </div>}

                <div style={{
                  marginTop: '16px',
                  padding: '14px',
                  backgroundColor: 'var(--subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#007F5F', marginBottom: '10px' }}>
                    INITIAL STOCK ALLOCATION (OPTIONAL)
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Product Item</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      placeholder="e.g. Mixture Pack 500g"
                    />
                  </div>
                  <div className="form-grid-3">
                    <div>
                      <label className="form-label">Units</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Unit Rate (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="form-label">Paid Now (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newPaid}
                        onChange={(e) => setNewPaid(e.target.value)}
                        min="0"
                        step="any"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Complete Store Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
