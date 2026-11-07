import React, { useEffect, useState } from 'react';
import {
  Download,
  Receipt,
  TrendingUp,
  Wallet,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDayAndDate } from '../utils/dateUtils';
import type { Order } from '../types';

export const ReportsPage: React.FC = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [preset, setPreset] = useState<'today' | '7days' | 'month'>('month');
  const [from, setFrom] = useState(firstDayOfMonth.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const applyPreset = (type: 'today' | '7days' | 'month') => {
    setPreset(type);
    const now = new Date();
    if (type === 'today') {
      const d = now.toISOString().slice(0, 10);
      setFrom(d);
      setTo(d);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setFrom(past.toISOString().slice(0, 10));
      setTo(now.toISOString().slice(0, 10));
    } else if (type === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(first.toISOString().slice(0, 10));
      setTo(now.toISOString().slice(0, 10));
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        from: new Date(from).toISOString(),
        to: new Date(`${to}T23:59:59.999Z`).toISOString(),
        limit: 100,
      });
      setOrders(res);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [from, to]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const csvData = await api.exportCsv({
        from: new Date(from).toISOString(),
        to: new Date(`${to}T23:59:59.999Z`).toISOString(),
      });

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `retailflow-audit-report-${from}-to-${to}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to generate CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const totalBilled = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
  const totalBaki = orders.reduce((sum, o) => sum + Number(o.baki || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  return (
    <div>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Financial Audit & Analytics Reports
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Period ledger reconciliations, transaction audit log, and instant CSV export
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchOrders} className="btn btn-outline" style={{ gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting || orders.length === 0}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            <Download size={16} />
            <span>{exporting ? 'Generating CSV…' : 'Export Full CSV Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Presets */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: 'Last 7 Days' },
              { key: 'month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key as any)}
                className={`btn ${preset === p.key ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '999px' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>From:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px', height: '36px', fontSize: '12px', padding: '6px 10px' }}
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset('' as any);
                }}
              />
            </div>
            <span style={{ color: '#94A3B8' }}>—</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>To:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px', height: '36px', fontSize: '12px', padding: '6px 10px' }}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset('' as any);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Period Financial Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>ORDERS IN RANGE</span>
            <Receipt size={18} color="#007F5F" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Dispatches recorded</div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>PERIOD BILLED</span>
            <TrendingUp size={18} color="#0F172A" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
            {formatMoney(totalBilled)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Gross order value</div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>COLLECTED</span>
            <Wallet size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
            {formatMoney(totalCollected)}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
            {collectionRate}% Realized
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>OUTSTANDING BAKI</span>
            <AlertTriangle size={18} color="#DC2626" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>
            {formatMoney(totalBaki)}
          </div>
          <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>
            Unsettled store credit
          </div>
        </div>
      </div>

      {/* Orders Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Transaction Audit Trail</h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>Detailed line-item record of each order dispatched</p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#007F5F',
            backgroundColor: '#EFF6FF',
            padding: '4px 10px',
            borderRadius: '6px',
          }}>
            {orders.length} AUDIT RECORDS
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Dispatch Date & Day</th>
                <th>Retailer Account</th>
                <th>SKU Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total Invoiced</th>
                <th>Collected</th>
                <th>Pending BAKI</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading Financial Transaction Ledger…</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <FileSpreadsheet size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>No Orders in Selected Date Range</div>
                    <div style={{ fontSize: '12px' }}>Adjust the date range or select "This Month" above.</div>
                  </td>
                </tr>
              ) : (
                orders.map((o, idx) => {
                  const isPaid = o.baki === 0;
                  return (
                    <tr key={o.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#007F5F' }}>
                          #{orders.length - idx}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {formatDayAndDate(o.date)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{o.shop?.name || 'Retail Merchant'}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{o.shop?.ownerName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{o.product}</div>
                        {o.notes && <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>Note: {o.notes}</div>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{o.quantity} pcs</td>
                      <td style={{ fontWeight: 600 }}>₹{o.unitPrice}</td>
                      <td style={{ fontWeight: 800 }}>{formatMoney(o.totalAmount)}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{formatMoney(o.paidAmount)}</td>
                      <td>
                        <span style={{ fontWeight: 900, color: isPaid ? '#10B981' : '#DC2626' }}>
                          {formatMoney(o.baki)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-paid' : 'badge-baki'}`}>
                          {isPaid ? 'Settled' : 'BAKI Due'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
