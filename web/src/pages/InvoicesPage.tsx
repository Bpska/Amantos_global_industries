import React, { useEffect, useState, useRef } from 'react';
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
  Upload,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportInvoiceToPdf } from '../utils/generateInvoicePdf';
import { sendInvoicePdfToWhatsApp } from '../utils/generateInvoiceDirectPdf';
import { formatDayAndDate, formatFullDayDate } from '../utils/dateUtils';
import type { BillingSetting, Order } from '../types';

const PRESET_LOGOS = [
  { id: 'amantos', name: 'Amantos AGI Gold (Official)', url: '/assets/brand/amantos-logo.jpg' },
  { id: 'master', name: 'HeyLane Master', url: '/assets/brand/HeyLane-Master.svg' },
  { id: 'symbol', name: 'HeyLane Symbol', url: '/assets/brand/HeyLane-Symbol.svg' },
];

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [billingTypeFilter, setBillingTypeFilter] = useState<'ALL' | 'ONLINE' | 'PHYSICAL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order for Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  // Billing Settings (Default to Amantos Global Industries)
  const [billingSettings, setBillingSettings] = useState<BillingSetting>({
    businessName: 'Amantos Global Industries',
    tagline: 'Industrial & Commercial Distribution Network',
    phone: '+91 98765 43210',
    address: 'Main Commercial Hub, Bhubaneswar, Odisha',
    terms: 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date. For digital payments, scan the authorized QR code with your sales executive.',
    logoUrl: '/assets/brand/amantos-logo.jpg',
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Edit settings form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formBusinessName, setFormBusinessName] = useState('Amantos Global Industries');
  const [formTagline, setFormTagline] = useState('Industrial & Commercial Distribution Network');
  const [formPhone, setFormPhone] = useState('+91 98765 43210');
  const [formAddress, setFormAddress] = useState('Main Commercial Hub, Bhubaneswar, Odisha');
  const [formTerms, setFormTerms] = useState('Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.');
  const [formLogoUrl, setFormLogoUrl] = useState('/assets/brand/amantos-logo.jpg');

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
          businessName: s.businessName || 'Amantos Global Industries',
          tagline: s.tagline || 'Industrial & Commercial Distribution Network',
          phone: s.phone || '+91 98765 43210',
          address: s.address || 'Main Commercial Hub, Bhubaneswar, Odisha',
          terms: s.terms || 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.',
          logoUrl: s.logoUrl || '/assets/brand/amantos-logo.jpg',
        });
        setFormBusinessName(s.businessName || 'Amantos Global Industries');
        setFormTagline(s.tagline || 'Industrial & Commercial Distribution Network');
        setFormPhone(s.phone || '+91 98765 43210');
        setFormAddress(s.address || 'Main Commercial Hub, Bhubaneswar, Odisha');
        setFormTerms(s.terms || 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.');
        setFormLogoUrl(s.logoUrl || '/assets/brand/amantos-logo.jpg');
      }
    } catch (err) {
      console.error('Failed to fetch billing settings:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [statusFilter, startDate, endDate]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo image is too large. Please select a file under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // If SVG vector, preserve directly
      if (file.type.includes('svg')) {
        setFormLogoUrl(rawDataUrl);
        return;
      }

      // Optimize and resize raster images via Canvas
      const img = new Image();
      img.onload = () => {
        const maxW = 500;
        const maxH = 250;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedUrl = canvas.toDataURL(file.type || 'image/png', 0.92);
          setFormLogoUrl(optimizedUrl);
        } else {
          setFormLogoUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setFormLogoUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
        logoUrl: formLogoUrl.trim() || '/assets/brand/amantos-logo.jpg',
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
    const dateStr = formatFullDayDate(order.date);
    const repName = order.salesperson?.name || 'Sales Representative';
    const businessTitle = (billingSettings.businessName || 'Amantos Global Industries').toUpperCase();

    const text = 
`🧾 *${businessTitle}*
━━━━━━━━━━━━━━━━━━━━
📄 *Tax Invoice / Cash Memo:* ${invNo}
📅 *Billing Day & Date:* ${dateStr}
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
📄 *Official PDF Invoice Generated & Attached*
👨‍💼 *Logged By:* ${repName}
🙏 Thank you for your business! Reach out to ${billingSettings.phone || 'us'} for queries.`;

    return text;
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!isAdmin) return;
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

  const handleDownloadPdf = async (order: Order) => {
    try {
      setGeneratingPdf(true);
      const invNo = getInvoiceNumber(order);
      let element = document.getElementById('printable-invoice');

      // If modal not currently open for this order, open it briefly to mount printable canvas
      if (!element || activeInvoice?.id !== order.id) {
        setActiveInvoice(order);
        await new Promise((r) => setTimeout(r, 120));
        element = document.getElementById('printable-invoice');
      }

      if (!element) {
        throw new Error('Printable invoice container is unavailable.');
      }

      const { download } = await exportInvoiceToPdf(element, invNo);
      download();
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF. Please try Print Memo.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendWhatsAppWithPdf = async (order: Order) => {
    if (!isAdmin) return;
    try {
      setGeneratingPdf(true);
      const shopInfo = {
        name: order.shop?.name || 'Retail Merchant',
        ownerName: order.shop?.ownerName,
        contactNumber: order.shop?.contactNumber,
        location: order.shop?.location,
      };
      await sendInvoicePdfToWhatsApp(order, shopInfo, billingSettings);
    } catch (err) {
      console.error('Failed to share PDF:', err);
      handleSendWhatsApp(order);
    } finally {
      setGeneratingPdf(false);
    }
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
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#007F5F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Receipt size={20} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
              {isAdmin ? 'Billing & Invoices' : 'My Orders & Invoices'}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            {isAdmin
              ? `Physical paper bills & online WhatsApp dispatches for ${billingSettings.businessName}. View bills, print cash memos, or send online bills directly to retailer WhatsApp.`
              : 'View your retailer orders, invoices, and payment balances.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && <button
            onClick={() => setSettingsModalOpen(true)}
            className="btn btn-outline"
            style={{ gap: '6px' }}
            title="Customize business name, tagline, address and terms"
          >
            <SlidersHorizontal size={14} />
            <span>Customize Billing</span>
          </button>}

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
          <div className="filter-pills-scroll" style={{ backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {[
              { key: 'ALL', label: 'All Bills' },
              { key: 'ONLINE', label: '🌐 Online' },
              { key: 'PHYSICAL', label: '📄 Physical' },
            ].map((bt) => (
              <button
                key={bt.key}
                type="button"
                onClick={() => setBillingTypeFilter(bt.key as any)}
                style={{
                  border: 'none',
                  background: billingTypeFilter === bt.key ? '#FFFFFF' : 'transparent',
                  color: billingTypeFilter === bt.key ? '#007F5F' : '#64748B',
                  fontWeight: billingTypeFilter === bt.key ? 800 : 600,
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: billingTypeFilter === bt.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {bt.label}
              </button>
            ))}
          </div>

          {/* Status Segmented Buttons */}
          <div className="filter-pills-scroll" style={{ backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {(['ALL', 'PAID', 'PARTIAL', 'UNPAID'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  border: 'none',
                  background: statusFilter === st ? '#FFFFFF' : 'transparent',
                  color: statusFilter === st ? '#007F5F' : '#64748B',
                  fontWeight: statusFilter === st ? 800 : 600,
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
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
        <div className="table-responsive desktop-table-view">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No & Billing Day</th>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#007F5F',
                            fontSize: '13px',
                          }}>
                            {invNo}
                          </span>
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#007F5F" />
                            {formatDayAndDate(ord.date)}
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
                          color: isPhysical ? '#D97706' : '#007F5F',
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

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(ord)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px', gap: '4px', borderColor: '#007F5F', color: '#007F5F' }}
                            title="Download Official PDF Invoice"
                            disabled={generatingPdf}
                          >
                            <FileDown size={13} />
                            <span>PDF</span>
                          </button>

                          {/* Online Billing: Admin can send WhatsApp */}
                          {isAdmin && !isPhysical ? (
                            <button
                              onClick={() => handleSendWhatsAppWithPdf(ord)}
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
                              title="Generate PDF bill & send to retailer WhatsApp"
                              disabled={generatingPdf}
                            >
                              <Send size={12} />
                              <span>WhatsApp</span>
                            </button>
                          ) : isPhysical ? (
                            <span style={{
                              fontSize: '11px',
                              color: '#64748B',
                              padding: '4px 6px',
                              fontStyle: 'italic',
                            }}>
                              Physical copy
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Invoices Cards View (screens <= 768px) */}
        <div className="mobile-cards-view">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading Billing Records…</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
              <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '15px' }}>No Billing Records Found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Invoices appear automatically when dispatches are logged.</div>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const invNo = getInvoiceNumber(ord);
              const isPaid = ord.baki === 0;
              const isPartial = ord.paidAmount > 0 && ord.baki > 0;
              const isPhysical = ord.billingType === 'PHYSICAL';

              return (
                <div key={ord.id} className="mobile-invoice-card">
                  <div className="mobile-invoice-header">
                    <div>
                      <div className="mobile-invoice-id">{invNo}</div>
                      <div className="mobile-invoice-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
                        <Calendar size={12} color="#007F5F" />
                        <span>{formatDayAndDate(ord.date)}</span>
                      </div>
                    </div>
                    <span className={`badge ${isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'}`}>
                      {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
                    </span>
                  </div>

                  <div className="mobile-invoice-body">
                    <div className="mobile-invoice-store">{ord.shop?.name || 'Store'}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>
                      {ord.shop?.ownerName} · +91 {ord.shop?.contactNumber}
                    </div>
                    <div className="mobile-invoice-product" style={{ marginTop: '6px' }}>
                      <strong>{ord.product}</strong> · {ord.quantity} units @ ₹{ord.unitPrice}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: isPhysical ? '#FEF3C7' : '#EFF6FF',
                        color: isPhysical ? '#D97706' : '#007F5F',
                      }}>
                        {isPhysical ? '📄 Physical' : '🌐 Online'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Rep: {ord.salesperson?.name || 'Field'}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-invoice-totals">
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: 700 }}>BILLED</span>
                      <strong style={{ fontSize: '14px', color: '#0F172A' }}>{formatMoney(ord.totalAmount)}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#10B981', display: 'block', fontWeight: 700 }}>PAID</span>
                      <strong style={{ fontSize: '14px', color: '#10B981' }}>{formatMoney(ord.paidAmount)}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: ord.baki > 0 ? '#DC2626' : '#64748B', display: 'block', fontWeight: 700 }}>BAKI DUE</span>
                      <strong style={{ fontSize: '14px', color: ord.baki > 0 ? '#DC2626' : '#10B981' }}>{formatMoney(ord.baki)}</strong>
                    </div>
                  </div>

                  <div className="mobile-card-actions" style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveInvoice(ord)}
                      className="btn btn-outline mobile-card-btn"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(ord)}
                      className="btn btn-outline mobile-card-btn"
                      style={{ color: '#007F5F', borderColor: '#007F5F' }}
                      disabled={generatingPdf}
                    >
                      <FileDown size={13} />
                      <span>PDF</span>
                    </button>
                    {isAdmin && !isPhysical ? (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppWithPdf(ord)}
                        className="btn mobile-card-btn"
                        style={{ backgroundColor: '#25D366', color: '#FFFFFF', border: 'none' }}
                        disabled={generatingPdf}
                      >
                        <Send size={13} />
                        <span>WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInvoice(ord);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="btn btn-outline mobile-card-btn"
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
                <Receipt size={18} color="#007F5F" />
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
              {/* Organization Header with Dynamic Logo and Dynamic Admin Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#070A0F',
                    border: '1.5px solid #D4AF37',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <img
                      src={billingSettings.logoUrl || '/assets/brand/amantos-logo.jpg'}
                      alt={billingSettings.businessName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/brand/amantos-logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                      {billingSettings.businessName}
                    </h1>
                    {billingSettings.tagline && (
                      <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {billingSettings.tagline}
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
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
                    color: activeInvoice.billingType === 'PHYSICAL' ? '#D97706' : '#007F5F',
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
                  <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Calendar size={12} color="#007F5F" />
                    <span>Billing Day: <strong>{formatFullDayDate(activeInvoice.date)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Billed To / Retailer Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                    Billing Option: <strong style={{ color: activeInvoice.billingType === 'PHYSICAL' ? '#D97706' : '#007F5F' }}>
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
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-outline"
                  style={{ gap: '6px' }}
                >
                  <Printer size={15} />
                  <span>Print Memo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeInvoice)}
                  className="btn btn-primary"
                  style={{ gap: '6px', backgroundColor: '#007F5F', color: '#FFFFFF' }}
                  disabled={generatingPdf}
                >
                  <FileDown size={15} />
                  <span>{generatingPdf ? 'Generating PDF…' : 'Download PDF Bill'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isAdmin && activeInvoice.billingType !== 'PHYSICAL' ? (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppWithPdf(activeInvoice)}
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
                    disabled={generatingPdf}
                    title="Generate PDF bill & send via WhatsApp"
                  >
                    <Send size={14} />
                    <span>Send PDF on WhatsApp</span>
                  </button>
                ) : activeInvoice.billingType === 'PHYSICAL' ? (
                  <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, backgroundColor: '#FEF3C7', padding: '6px 12px', borderRadius: '6px' }}>
                    📄 Physical Paper Bill Issued
                  </span>
                ) : null}

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
      {isAdmin && settingsModalOpen && (
        <div className="modal-overlay" onClick={() => setSettingsModalOpen(false)}>
          <div
            className="modal-container"
            style={{ maxWidth: '520px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="#007F5F" />
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
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Logo Customization Section */}
                <div style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800 }}>Bill / Invoice Logo</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                      Renders on bills &amp; printed cash memos
                    </span>
                  </label>

                  {/* Logo Live Preview Frame */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    marginBottom: '12px',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}>
                        <img
                          src={formLogoUrl || '/assets/brand/amantos-logo.jpg'}
                          alt="Logo Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/brand/amantos-logo.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                          {formLogoUrl.startsWith('data:')
                            ? 'Custom Uploaded Logo'
                            : formLogoUrl.includes('amantos-logo')
                            ? 'Amantos AGI Gold (Official Logo)'
                            : formLogoUrl.includes('HeyLane-Master')
                            ? 'HeyLane Master Logo'
                            : formLogoUrl.includes('HeyLane-Symbol')
                            ? 'HeyLane Symbol Vector'
                            : 'Selected Logo'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Positioned at invoice header next to "{formBusinessName || 'Company'}"
                        </div>
                      </div>
                    </div>

                    {formLogoUrl !== '/assets/brand/amantos-logo.jpg' && (
                      <button
                        type="button"
                        onClick={() => setFormLogoUrl('/assets/brand/amantos-logo.jpg')}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '4px 8px', gap: '4px', color: '#64748B' }}
                        title="Reset to default Amantos AGI logo"
                      >
                        <RotateCcw size={12} />
                        <span>Reset to AGI</span>
                      </button>
                    )}
                  </div>

                  {/* Logo Actions: Upload & Presets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleLogoFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '9px',
                        fontWeight: 700,
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #007F5F',
                        color: '#007F5F',
                      }}
                    >
                      <Upload size={15} color="#007F5F" />
                      <span>Upload Custom Logo File (PNG, JPG, SVG, WebP)</span>
                    </button>

                    {/* Presets */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                        Or pick from brand presets:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {PRESET_LOGOS.map((preset) => {
                          const isSelected = formLogoUrl === preset.url;
                          return (
                            <button
                              key={preset.url}
                              type="button"
                              onClick={() => setFormLogoUrl(preset.url)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid #007F5F' : '1px solid #E2E8F0',
                                backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <img
                                src={preset.url}
                                alt={preset.name}
                                style={{ height: '24px', width: 'auto', maxWidth: '80px', objectFit: 'contain' }}
                              />
                              <span style={{
                                fontSize: '10px',
                                fontWeight: isSelected ? 800 : 600,
                                color: isSelected ? '#007F5F' : '#475569',
                                textAlign: 'center',
                              }}>
                                {preset.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Business / Brand Name on Bill *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="e.g. HeyLane or Amantos Global Industries"
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    Printed as the main organization header on all customer bills and cash memos.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Tagline / Commercial Subtitle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. Wholesale & Retail Replenishment Network"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Customer Support / Dispatch Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Commercial Hub / Dispatch Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. Main Commercial Hub, Sector 12"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>Invoice Terms, Policy &amp; Warranty</label>
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
