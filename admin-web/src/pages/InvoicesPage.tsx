import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Send,
  Eye,
  Printer,
  X,
  RefreshCw,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import type { BillingSetting, Order } from '../types';

export const InvoicesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [billingTypeFilter, setBillingTypeFilter] = useState<'ALL' | 'ONLINE' | 'PHYSICAL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order for Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  // Billing Settings
  const [billingSettings, setBillingSettings] = useState<BillingSetting>({
    businessName: 'AGI',
    tagline: 'Wholesale & Retail Replenishment Network',
    phone: '+91 98765 43210',
    address: 'Main Commercial Hub',
    terms: 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date. For digital payments, scan the authorized QR code with your sales executive.',
    logoUrl: '/assets/agi-logo.jpg',
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Edit settings form
  const [formBusinessName, setFormBusinessName] = useState('AGI');
  const [formTagline, setFormTagline] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTerms, setFormTerms] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 100,
      });
      setOrders(res);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const s = await api.getBillingSettings();
      if (s) {
        setBillingSettings({
          businessName: s.businessName || 'AGI',
          tagline: s.tagline || 'Wholesale & Retail Replenishment Network',
          phone: s.phone || '+91 98765 43210',
          address: s.address || 'Main Commercial Hub',
          terms: s.terms || 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.',
          logoUrl: s.logoUrl || '/assets/agi-logo.jpg',
        });
        setFormBusinessName(s.businessName || 'AGI');
        setFormTagline(s.tagline || 'Wholesale & Retail Replenishment Network');
        setFormPhone(s.phone || '+91 98765 43210');
        setFormAddress(s.address || 'Main Commercial Hub');
        setFormTerms(s.terms || 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.');
      }
    } catch (err) {
      console.error('Failed to fetch billing settings:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [statusFilter, startDate, endDate]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBusinessName.trim()) {
      alert('Business name is required.');
      return;
    }

    try {
      setSavingSettings(true);
      const updated = await api.updateBillingSettings({
        businessName: formBusinessName.trim(),
        tagline: formTagline.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        terms: formTerms.trim(),
        logoUrl: '/assets/agi-logo.jpg',
      });
      setBillingSettings(updated);
      setSettingsSavedSuccess(true);
      setTimeout(() => {
        setSettingsSavedSuccess(false);
        setSettingsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save billing configuration.');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const formatDate = (isoString: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInvoiceNumber = (order: Order) => {
    if (order.invoiceNumber) return order.invoiceNumber;
    const year = new Date(order.date || Date.now()).getFullYear();
    const hash = (order.id || '000000').slice(0, 6).toUpperCase();
    return `INV-${year}-${hash}`;
  };

  const generateWhatsAppMessage = (order: Order) => {
    const invNo = getInvoiceNumber(order);
    const shopName = order.shop?.name || 'Retailer';
    const ownerName = order.shop?.ownerName || 'Valued Partner';
    const phone = order.shop?.contactNumber || '';
    const location = order.shop?.location || 'Store Address';
    const dateStr = formatDate(order.date);
    const repName = order.salesperson?.name || 'Sales Representative';
    const businessTitle = (billingSettings.businessName || 'AGI').toUpperCase();

    const text = 
`🧾 *${businessTitle} RETAIL DISTRIBUTION*
━━━━━━━━━━━━━━━━━━━━
📄 *Tax Invoice / Cash Memo:* ${invNo}
📅 *Date:* ${dateStr}
🏪 *Store:* ${shopName}
👤 *Proprietor:* ${ownerName}
📞 *Mobile:* +91 ${phone}
📍 *Location:* ${location}
━━━━━━━━━━━━━━━━━━━━
📦 *DISPATCH DETAILS:*
• Item: *${order.product}*
• Quantity: *${order.quantity} units*
• Unit Rate: *₹${Number(order.unitPrice || 0).toFixed(2)}*
• Total Invoiced: *₹${Number(order.totalAmount || 0).toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT BREAKDOWN:*
• Paid Amount: *₹${Number(order.paidAmount || 0).toFixed(2)}*
• Balance Due (BAKI): *₹${Number(order.baki || 0).toFixed(2)}*
• Status: *${order.baki === 0 ? '✅ FULLY PAID' : (order.paidAmount > 0 ? '⚠️ PARTIAL' : '🔴 UNPAID / DUE')}*
━━━━━━━━━━━━━━━━━━━━
👨‍💼 *Logged By Rep:* ${repName}
🙏 Thank you for your business! Reach out to ${billingSettings.phone || 'us'} for repeat orders.`;

    return text;
  };

  const handleSendWhatsApp = (order: Order) => {
    const phone = (order.shop?.contactNumber || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('Retailer contact phone is missing.');
      return;
    }
    const msg = generateWhatsAppMessage(order);
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    const inv = getInvoiceNumber(o).toLowerCase();
    const shop = (o.shop?.name || '').toLowerCase();
    const owner = (o.shop?.ownerName || '').toLowerCase();
    const phone = (o.shop?.contactNumber || '').toLowerCase();
    const product = (o.product || '').toLowerCase();
    const matchesSearch = inv.includes(term) || shop.includes(term) || owner.includes(term) || phone.includes(term) || product.includes(term);

    const matchesBillingType =
      billingTypeFilter === 'ALL' ||
      (billingTypeFilter === 'PHYSICAL' && o.billingType === 'PHYSICAL') ||
      (billingTypeFilter === 'ONLINE' && o.billingType !== 'PHYSICAL');

    return matchesSearch && matchesBillingType;
  });

  // Aggregates
  const totalBilled = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCollected = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalBaki = filteredOrders.reduce((sum, o) => sum + (o.baki || 0), 0);

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Receipt size={20} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Billing & Invoices
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Physical paper bills & online WhatsApp dispatches for {billingSettings.businessName}. View bills, print cash memos, or send online bills directly to retailer WhatsApp.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="btn btn-outline"
            style={{ gap: '6px' }}
            title="Customize business name, tagline, address and terms"
          >
            <SlidersHorizontal size={14} />
            <span>Customize Billing</span>
          </button>

          <button onClick={fetchInvoices} className="btn btn-outline" style={{ gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            TOTAL INVOICED
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
            {formatMoney(totalBilled)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
            Across {filteredOrders.length} generated bills
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            TOTAL COLLECTED
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
            {formatMoney(totalCollected)}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 700 }}>
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100}% Settlement
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
            OUTSTANDING BAKI
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>
            {formatMoney(totalBaki)}
          </div>
          <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
            Pending collection from retailers
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search by invoice #, store, proprietor, phone, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          </div>

          {/* Billing Type Selector (Physical vs Online) */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {[
              { key: 'ALL', label: 'All Bills' },
              { key: 'ONLINE', label: '🌐 Online (WhatsApp)' },
              { key: 'PHYSICAL', label: '📄 Physical Bill' },
            ].map((bt) => (
              <button
                key={bt.key}
                type="button"
                onClick={() => setBillingTypeFilter(bt.key as any)}
                style={{
                  border: 'none',
                  background: billingTypeFilter === bt.key ? '#FFFFFF' : 'transparent',
                  color: billingTypeFilter === bt.key ? '#1D4ED8' : '#64748B',
                  fontWeight: billingTypeFilter === bt.key ? 800 : 600,
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: billingTypeFilter === bt.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {bt.label}
              </button>
            ))}
          </div>

          {/* Status Segmented Buttons */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {(['ALL', 'PAID', 'PARTIAL', 'UNPAID'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  border: 'none',
                  background: statusFilter === st ? '#FFFFFF' : 'transparent',
                  color: statusFilter === st ? '#1D4ED8' : '#64748B',
                  fontWeight: statusFilter === st ? 800 : 600,
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="#64748B" />
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From Date"
            />
            <span style={{ color: '#94A3B8' }}>–</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To Date"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '11px', color: '#DC2626' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No & Date</th>
                <th>Retailer / Store</th>
                <th>Dispatched SKU</th>
                <th>Billing Mode</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Pending BAKI</th>
                <th>Status</th>
                <th>Sales Rep</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading Invoices & Billing Records…</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>No Billing Records Found</div>
                    <div style={{ fontSize: '12px' }}>Invoices are automatically generated when staff onboard stores or log repeat dispatches.</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const invNo = getInvoiceNumber(ord);
                  const isPaid = ord.baki === 0;
                  const isPartial = ord.paidAmount > 0 && ord.baki > 0;
                  const isPhysical = ord.billingType === 'PHYSICAL';

                  return (
                    <tr key={ord.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#1D4ED8',
                            fontSize: '13px',
                          }}>
                            {invNo}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {formatDate(ord.date)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A' }}>
                            {ord.shop?.name || 'Store'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {ord.shop?.ownerName} · +91 {ord.shop?.contactNumber}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{ord.product}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {ord.quantity} units @ ₹{ord.unitPrice}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: isPhysical ? '#FEF3C7' : '#EFF6FF',
                          color: isPhysical ? '#D97706' : '#1D4ED8',
                          border: isPhysical ? '1px solid #FDE68A' : '1px solid #BFDBFE',
                        }}>
                          {isPhysical ? '📄 Physical' : '🌐 Online'}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, fontSize: '14px' }}>
                        {formatMoney(ord.totalAmount)}
                      </td>

                      <td style={{ fontWeight: 800, color: '#10B981' }}>
                        {formatMoney(ord.paidAmount)}
                      </td>

                      <td>
                        <span style={{
                          fontWeight: 900,
                          color: ord.baki > 0 ? '#DC2626' : '#10B981',
                        }}>
                          {formatMoney(ord.baki)}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'}`}>
                          {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                          {ord.salesperson?.name || 'Field Agent'}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => setActiveInvoice(ord)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
                            title="View Full Bill & Printable Cash Memo"
                          >
                            <Eye size={13} />
                            <span>View Bill</span>
                          </button>

                          {/* Online Billing: Admin can send WhatsApp */}
                          {!isPhysical ? (
                            <button
                              onClick={() => handleSendWhatsApp(ord)}
                              style={{
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Send invoice breakdown to retailer WhatsApp"
                            >
                              <Send size={12} />
                              <span>WhatsApp</span>
                            </button>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              color: '#64748B',
                              padding: '4px 6px',
                              fontStyle: 'italic',
                            }}>
                              Physical copy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Screen Printable Invoice Modal */}
      {activeInvoice && (
        <div className="modal-overlay" onClick={() => setActiveInvoice(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: '640px', width: '95%', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#1D4ED8" />
                <span style={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
                  Tax Invoice / Cash Memo
                </span>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Paper Canvas */}
            <div id="printable-invoice" style={{ padding: '24px', backgroundColor: '#FFFFFF', color: '#0F172A' }}>
              {/* Organization Header with AGI Logo and Dynamic Admin Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src="/assets/agi-logo.jpg"
                    alt="AGI Logo"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                      {billingSettings.businessName}
                    </h1>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      {billingSettings.tagline}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B' }}>
                      Support: {billingSettings.phone} · {billingSettings.address}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: activeInvoice.billingType === 'PHYSICAL' ? '#D97706' : '#1D4ED8',
                    backgroundColor: activeInvoice.billingType === 'PHYSICAL' ? '#FEF3C7' : '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '6px',
                  }}>
                    {activeInvoice.billingType === 'PHYSICAL' ? 'PHYSICAL BILL' : 'ONLINE BILLING'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace' }}>
                    {getInvoiceNumber(activeInvoice)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Date: {formatDate(activeInvoice.date)}
                  </div>
                </div>
              </div>

              {/* Billed To / Retailer Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px 0',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '13px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                    BILLED TO (RETAILER)
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                    {activeInvoice.shop?.name || 'Retail Store'}
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    Proprietor: {activeInvoice.shop?.ownerName || '—'}
                  </div>
                  <div style={{ color: '#475569' }}>
                    Phone: +91 {activeInvoice.shop?.contactNumber || '—'}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
                    📍 {activeInvoice.shop?.location || 'Store address'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                    FULFILLMENT DETAILS
                  </div>
                  <div style={{ color: '#475569' }}>
                    Dispatched By: <strong style={{ color: '#0F172A' }}>{activeInvoice.salesperson?.name || 'Sales Rep'}</strong>
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    Billing Option: <strong style={{ color: activeInvoice.billingType === 'PHYSICAL' ? '#D97706' : '#1D4ED8' }}>
                      {activeInvoice.billingType === 'PHYSICAL' ? 'Physical Paper Bill' : 'Online Digital Memo'}
                    </strong>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge ${activeInvoice.baki === 0 ? 'badge-paid' : activeInvoice.paidAmount > 0 ? 'badge-partial' : 'badge-unpaid'}`}>
                      {activeInvoice.baki === 0 ? 'SETTLED IN FULL' : activeInvoice.paidAmount > 0 ? 'PARTIALLY SETTLED' : 'PAYMENT DUE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, color: '#475569' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, color: '#475569' }}>Item Description</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, color: '#475569' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 800, color: '#475569' }}>Rate (₹)</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 800, color: '#475569' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', color: '#64748B' }}>1</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{activeInvoice.product}</div>
                        {activeInvoice.notes && (
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Note: {activeInvoice.notes}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{activeInvoice.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Number(activeInvoice.unitPrice || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>{formatMoney(activeInvoice.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <div style={{ width: '280px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B' }}>Subtotal:</span>
                    <span style={{ fontWeight: 700 }}>{formatMoney(activeInvoice.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E2E8F0', color: '#10B981' }}>
                    <span style={{ fontWeight: 700 }}>Amount Paid:</span>
                    <span style={{ fontWeight: 800 }}>{formatMoney(activeInvoice.paidAmount)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: '2px solid #0F172A',
                    marginTop: '4px',
                    fontSize: '15px',
                  }}>
                    <span style={{ fontWeight: 900, color: activeInvoice.baki > 0 ? '#DC2626' : '#0F172A' }}>
                      Balance Due (BAKI):
                    </span>
                    <span style={{ fontWeight: 900, color: activeInvoice.baki > 0 ? '#DC2626' : '#10B981' }}>
                      {formatMoney(activeInvoice.baki)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Footer Note */}
              <div style={{
                marginTop: '24px',
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '11px',
                color: '#64748B',
                lineHeight: '1.5',
              }}>
                <div><strong>Terms & Conditions:</strong> {billingSettings.terms}</div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
            }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-outline"
                style={{ gap: '6px' }}
              >
                <Printer size={15} />
                <span>Print Memo</span>
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {activeInvoice.billingType !== 'PHYSICAL' ? (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(activeInvoice)}
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={14} />
                    <span>Send to WhatsApp</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, backgroundColor: '#FEF3C7', padding: '6px 12px', borderRadius: '6px' }}>
                    📄 Physical Paper Bill Issued
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Billing Customization Modal */}
      {settingsModalOpen && (
        <div className="modal-overlay" onClick={() => setSettingsModalOpen(false)}>
          <div
            className="modal-container"
            style={{ maxWidth: '520px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="#1D4ED8" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Customize Billing Details
                </h3>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="modal-body">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px',
                }}>
                  <img
                    src="/assets/agi-logo.jpg"
                    alt="AGI Logo"
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Official Brand Logo: AGI</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Logo is placed automatically on every invoice and cash memo.</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Business / Brand Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="e.g. AGI"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tagline / Business Subtitle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. Wholesale & Retail Replenishment Network"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Support / Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hub / Commercial Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. Main Commercial Hub, Sector 12"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Terms & Policy</label>
                  <textarea
                    className="form-input"
                    style={{ height: '70px', resize: 'vertical' }}
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    placeholder="Warranty, credit cycle, and return terms..."
                  />
                </div>

                {settingsSavedSuccess && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    <Check size={16} />
                    <span>Billing details updated & saved successfully!</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving Details…' : 'Save Billing Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
