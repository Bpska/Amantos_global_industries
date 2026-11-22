import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  FileDown,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { formatFullDayDate } from '../utils/dateUtils';
import { exportInvoiceToPdf } from '../utils/generateInvoicePdf';
import { parseBillProductItems } from '../utils/parseBillItems';
import type { BillingSetting, Order } from '../types';

export const PublicInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [billing, setBilling] = useState<BillingSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        // Call public endpoint
        const res = await fetch(`/api/v1/orders/public/${id}`);
        if (!res.ok) {
          throw new Error('Invoice not found or link expired');
        }
        const json = await res.json();
        if (json.success && json.data) {
          setInvoice(json.data);
          setBilling(json.data.billingSettings);
        } else {
          throw new Error(json.message || 'Unable to load invoice');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownload = async () => {
    const el = document.getElementById('printable-public-invoice');
    if (!el || !invoice) return;
    try {
      setGeneratingPdf(true);
      const invNo = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6).toUpperCase()}`;
      const { download } = await exportInvoiceToPdf(el, invNo);
      download();
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <RefreshCw size={36} className="animate-spin" color="#007F5F" style={{ marginBottom: '14px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Loading Official Invoice…</h3>
        <p style={{ fontSize: '13px', color: '#64748B' }}>Fetching verified digital tax invoice details.</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '20px' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Invoice Not Found</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
            {error || 'This invoice link may be invalid, removed, or expired.'}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', padding: '10px 20px', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Go to Portal Login</span>
          </Link>
        </div>
      </div>
    );
  }

  const businessTitle = (billing?.businessName || 'Amanta Global Industries').toUpperCase();
  const invNo = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6).toUpperCase()}`;
  const isPaid = invoice.baki === 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', padding: '20px 12px' }}>
      {/* Action Navigation Header */}
      <div style={{ maxWidth: '780px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="#007F5F" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Digital Tax Invoice</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px', gap: '6px', backgroundColor: '#FFFFFF' }}
          >
            <Printer size={15} />
            <span>Print Bill</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={generatingPdf}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px', backgroundColor: '#007F5F' }}
          >
            <FileDown size={15} />
            <span>{generatingPdf ? 'Generating PDF…' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card Container */}
      <div
        id="printable-public-invoice"
        style={{
          maxWidth: '780px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div style={{
          backgroundColor: '#007F5F',
          color: '#FFFFFF',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              {businessTitle}
            </h1>
            <p style={{ fontSize: '12px', margin: '4px 0 0', opacity: 0.9 }}>
              {billing?.tagline || 'Industrial & Commercial Distribution Network'}
            </p>
            <p style={{ fontSize: '11px', margin: '4px 0 0', opacity: 0.8 }}>
              {billing?.address || 'Main Commercial Hub, Bhubaneswar, Odisha'} | Helpline: {billing?.phone || '+91 91244 22670'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: isPaid ? '#10B981' : '#DC2626',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {isPaid ? 'PAID / SETTLED' : 'BAKI OUTSTANDING'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '6px', opacity: 0.9 }}>
              {invNo}
            </div>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                BILLED TO (RETAILER)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                {invoice.shop?.name || 'Retail Merchant'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Proprietor: {invoice.shop?.ownerName || 'Merchant'}
              </div>
              <div style={{ fontSize: '12px', color: '#007F5F', fontWeight: 700, marginTop: '2px' }}>
                📞 +91 {invoice.shop?.contactNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                📍 {invoice.shop?.location || 'Store Address'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                INVOICE PARTICULARS
              </div>
              <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>
                Invoice No: <span style={{ color: '#007F5F' }}>{invNo}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Billing Date: {formatFullDayDate(invoice.date)}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Billing Mode: <strong>{invoice.billingType || 'ONLINE'}</strong>
              </div>
              {invoice.salesperson && (
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Field Rep: {invoice.salesperson.name}
                </div>
              )}
            </div>
          </div>

          {/* Table of Items */}
          <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                  <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800 }}>ITEM / DESCRIPTION</th>
                  <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>QTY</th>
                  <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, textAlign: 'right' }}>RATE (₹)</th>
                  <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 800, textAlign: 'right' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const items = parseBillProductItems(
                    invoice.product,
                    invoice.quantity,
                    Number(invoice.unitPrice || 0),
                    Number(invoice.totalAmount || 0)
                  );
                  return items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '14px', fontSize: '13px', textAlign: 'center', color: '#334155' }}>
                        {item.quantity} pcs
                      </td>
                      <td style={{ padding: '14px', fontSize: '13px', textAlign: 'right', color: '#334155' }}>
                        ₹{Number(item.unitPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px', fontSize: '14px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                        ₹{Number(item.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '100%', maxWidth: '320px', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748B' }}>
                <span>Total Invoiced:</span>
                <strong style={{ color: '#0F172A' }}>₹{Number(invoice.totalAmount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#10B981' }}>
                <span>Amount Paid:</span>
                <strong>₹{Number(invoice.paidAmount || 0).toFixed(2)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid #E2E8F0',
                fontSize: '15px',
                fontWeight: 900,
                color: invoice.baki > 0 ? '#DC2626' : '#10B981',
              }}>
                <span>{invoice.baki > 0 ? 'Outstanding BAKI:' : 'Balance Due:'}</span>
                <span>₹{Number(invoice.baki || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Footer */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '11px', color: '#64748B', lineHeight: '1.6' }}>
            <div><strong>Terms & Conditions:</strong> {billing?.terms || 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.'}</div>
            <div style={{ marginTop: '8px', textAlign: 'center', color: '#94A3B8' }}>
              Official Computer Generated Tax Invoice · Powered by Amanta Global Industries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
