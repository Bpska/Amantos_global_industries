import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates an A4 PDF from a printable DOM element.
 * Returns the PDF file, blob, and methods to download or share.
 */
export const exportInvoiceToPdf = async (
  element: HTMLElement,
  invoiceNumber: string
): Promise<{ file: File; blob: Blob; download: () => void; openInNewTab: () => void }> => {
  // Capture high-DPI canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 10;
  const marginY = 10;
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidth, contentHeight);

  const cleanInvNo = (invoiceNumber || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanInvNo}.pdf`;
  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  const download = () => {
    pdf.save(filename);
  };

  const openInNewTab = () => {
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  return { file, blob, download, openInNewTab };
};

