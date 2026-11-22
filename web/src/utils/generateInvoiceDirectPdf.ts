import jsPDF from 'jspdf';
import type { BillingSetting, Order } from '../types';
import { formatFullDayDate } from './dateUtils';
import { parseBillProductItems } from './parseBillItems';

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

  const businessName = (billingSettings?.businessName || 'Amanta Global Industries').toUpperCase();
  const tagline = billingSettings?.tagline || 'Industrial & Commercial Distribution Network';
  const phone = billingSettings?.phone || '+91 91244 22670';
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

  // Table Body: Parse individual items line by line
  const parsedItems = parseBillProductItems(
    order.product,
    order.quantity,
    Number(order.unitPrice || 0),
    Number(order.totalAmount || 0)
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  let currentY = 93;
  parsedItems.forEach((item) => {
    // Truncate long product names if necessary
    const truncatedName = item.name.length > 44 ? `${item.name.slice(0, 42)}…` : item.name;
    doc.text(truncatedName, 18, currentY);
    doc.text(`${item.quantity} pcs`, 110, currentY);
    doc.text(`Rs. ${Number(item.unitPrice).toFixed(2)}`, 135, currentY);
    doc.text(`Rs. ${Number(item.total).toFixed(2)}`, 165, currentY);
    currentY += 8;
  });

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY + 2, 196, currentY + 2);

  // Totals Box
  const startY = currentY + 10;
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
  const termsY = Math.max(startY + 28, 145);
  doc.text(termsText, 14, termsY, { maxWidth: 182 });

  doc.setFont('helvetica', 'normal');
  doc.text('Computer generated digital tax invoice powered by Amanta Global Industries.', 14, termsY + 12);

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
  const { blob, filename } = createOrderPdfBlob(order, shop, billingSettings);
  const cleanPhone = (shop.contactNumber || '').replace(/[^0-9]/g, '');
  const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const brandTitle = (billingSettings?.businessName || 'Amanta Global Industries').toUpperCase();
  const invNo = order.invoiceNumber || `INV-${new Date(order.date).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`;

  // Generate public view / download link for the customer
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://industri.heylane.in';
  const invoiceLink = `${origin}/invoice/${order.id}`;

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
🔗 *View & Download Full Bill Online:*
👉 ${invoiceLink}

🙏 Thank you for your business with ${brandTitle}!`;

  // 1. Auto-download the PDF invoice so the user has the physical PDF ready
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  // 2. Open WhatsApp directly to the customer's chat without showing Windows Share sheet
  const encodedText = encodeURIComponent(messageText);
  const waDirectUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;

  // Open direct WhatsApp chat conversation with that number
  const win = window.open(waDirectUrl, '_blank');
  if (!win || win.closed || typeof win.closed === 'undefined') {
    window.location.href = waDirectUrl;
  }
};

