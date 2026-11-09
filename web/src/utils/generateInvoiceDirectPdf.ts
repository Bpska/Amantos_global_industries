import jsPDF from 'jspdf';
import type { BillingSetting, Order } from '../types';
import { formatFullDayDate } from './dateUtils';

/**
 * Builds a professional PDF file for an order/invoice directly with jsPDF.
 */
export const createOrderPdfBlob = (
  order: Order,
  shop: { name: string; ownerName?: string; contactNumber?: string; location?: string },
  billingSettings?: BillingSetting | null
): { blob: Blob; file: File; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const businessName = (billingSettings?.businessName || 'Amantos Global Industries').toUpperCase();
  const tagline = billingSettings?.tagline || 'Industrial & Commercial Distribution Network';
  const phone = billingSettings?.phone || '+91 98765 43210';
  const address = billingSettings?.address || 'Main Commercial Hub, Bhubaneswar, Odisha';
  const gstin = billingSettings?.gstin || '';
  const invNo = order.invoiceNumber || `INV-${new Date(order.date).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`;
  const dateStr = formatFullDayDate(order.date);

  // Header background
  doc.setFillColor(0, 127, 95); // Brand Green
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(businessName, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(tagline, 14, 20);
  doc.text(`${address} | Helpline: ${phone}${gstin ? ` | GSTIN: ${gstin}` : ''}`, 14, 26);

  // Invoice Meta
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE / CASH MEMO', 14, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invNo}`, 14, 52);
  doc.text(`Billing Date: ${dateStr}`, 14, 58);
  doc.text(`Payment Status: ${order.baki === 0 ? 'FULLY PAID' : (order.paidAmount > 0 ? 'PARTIAL BAKI' : 'UNPAID / DUE')}`, 14, 64);

  // Bill To (Right Box)
  doc.setFillColor(248, 250, 252);
  doc.rect(110, 38, 86, 32, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(110, 38, 86, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (RETAIL STORE):', 114, 44);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(shop.name || 'Retail Merchant', 114, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Proprietor: ${shop.ownerName || 'Merchant'} | Mob: +91 ${shop.contactNumber || ''}`, 114, 57);
  doc.text(`Location: ${(shop.location || '').slice(0, 42)}`, 114, 63);

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 78, 182, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEM DESCRIPTION', 18, 84);
  doc.text('QTY', 110, 84);
  doc.text('RATE (INR)', 135, 84);
  doc.text('AMOUNT (INR)', 165, 84);

  // Table Body
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(order.product || 'Product Pack', 18, 96);
  doc.text(`${order.quantity} pcs`, 110, 96);
  doc.text(`Rs. ${Number(order.unitPrice || 0).toFixed(2)}`, 135, 96);
  doc.text(`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`, 165, 96);

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 104, 196, 104);

  // Totals Box
  const startY = 112;
  doc.setFont('helvetica', 'normal');
  doc.text('Total Invoiced Amount:', 120, startY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`, 170, startY);

  doc.setFont('helvetica', 'normal');
  doc.text('Amount Received (Paid):', 120, startY + 8);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${Number(order.paidAmount || 0).toFixed(2)}`, 170, startY + 8);

  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text('Outstanding Balance (BAKI):', 120, startY + 16);
  doc.text(`Rs. ${Number(order.baki || 0).toFixed(2)}`, 170, startY + 16);

  // Terms and Note
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const termsText = billingSettings?.terms ||
    'Goods once sold are subject to quality warranty. Please clear pending BAKI within 30 days of invoice date.';
  doc.text(termsText, 14, 150, { maxWidth: 182 });

  doc.setFont('helvetica', 'normal');
  doc.text('Computer generated digital tax invoice powered by HeyLane.', 14, 162);

  const cleanInvNo = invNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanInvNo}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { blob, file, filename };
};

/**
 * Shares or sends the invoice PDF directly to WhatsApp.
 * Uses Web Share API (which natively attaches the actual .pdf file in WhatsApp),
 * and automatically downloads the PDF and opens WhatsApp Web/Mobile chat.
 */
export const sendInvoicePdfToWhatsApp = async (
  order: Order,
  shop: { name: string; ownerName?: string; contactNumber?: string; location?: string },
  billingSettings?: BillingSetting | null
): Promise<void> => {
  const { blob, file, filename } = createOrderPdfBlob(order, shop, billingSettings);
  const cleanPhone = (shop.contactNumber || '').replace(/[^0-9]/g, '');
  const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const brandTitle = (billingSettings?.businessName || 'Amantos Global Industries').toUpperCase();
  const invNo = order.invoiceNumber || `INV-${new Date(order.date).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`;

  const messageText = 
`🧾 *${brandTitle} - TAX INVOICE*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invNo}
🏪 *Store:* ${shop.name}
👤 *Proprietor:* ${shop.ownerName || 'Merchant'}
💰 *Billed:* ₹${Number(order.totalAmount || 0).toFixed(2)}
✅ *Paid:* ₹${Number(order.paidAmount || 0).toFixed(2)}
🔴 *BAKI Due:* ₹${Number(order.baki || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
📎 *Official Invoice PDF file is generated and attached.*`;

  // 1. If Web Share API with files is supported (Mobile Chrome, Safari, Android, iOS)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `${brandTitle} Invoice ${invNo}`,
        text: messageText,
        files: [file],
      });
      return;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Web Share failed, using download + WhatsApp fallback:', e);
      }
    }
  }

  // 2. Fallback for Desktop browsers: Auto-download the PDF file directly so user has it ready, then open WhatsApp chat
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  // Open WhatsApp chat directly with the customer
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
  window.open(waUrl, '_blank');
};

